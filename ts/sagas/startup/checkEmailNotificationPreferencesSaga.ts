import * as pot from "italia-ts-commons/lib/pot";
import { SagaIterator } from "redux-saga";
import {
  cancel,
  Effect,
  fork,
  put,
  select,
  take,
  takeEvery
} from "redux-saga/effects";
import { getType } from "typesafe-actions";
import { BlockedInboxOrChannels } from "../../../definitions/backend/BlockedInboxOrChannels";
import { customEmailChannelSetEnabled } from "../../store/actions/persistedPreferences";
import { profileLoadSuccess } from "../../store/actions/profile";
import { loadVisibleServices } from "../../store/actions/services";
import {
  visibleServicesSelector,
  VisibleServicesState
} from "../../store/reducers/entities/services/visibleServices";
import { isCustomEmailChannelEnabledSelector } from "../../store/reducers/persistedPreferences";
import { profileSelector, ProfileState } from "../../store/reducers/profile";

/**
 * A saga to match at the first startup if the user has customized settings related to the
 * forwarding of notifications on the verified email within previous installations
 */
export function* watchEmailNotificationPreferencesSaga(): IterableIterator<
  Effect
> {
  const isCustomEmailChannelEnabled: ReturnType<
    typeof isCustomEmailChannelEnabledSelector
  > = yield select(isCustomEmailChannelEnabledSelector);

  if (pot.isSome(isCustomEmailChannelEnabled)) {
    return;
  }

  const checkSaga = yield fork(checkEmailNotificationPreferencesSaga);
  yield take(customEmailChannelSetEnabled);
  yield cancel(checkSaga);
}

export function* checkEmailNotificationPreferencesSaga(): SagaIterator {
  yield takeEvery(
    [getType(profileLoadSuccess), getType(loadVisibleServices.success)],
    function*() {
      const potProfile: ProfileState = yield select(profileSelector);
      const potVisibleServices: VisibleServicesState = yield select(
        visibleServicesSelector
      );
      if (pot.isSome(potVisibleServices) && pot.isSome(potProfile)) {
        const blockedChannels: BlockedInboxOrChannels = pot.getOrElse(
          pot.mapNullable(potProfile, up => up.blocked_inbox_or_channels),
          {} as BlockedInboxOrChannels
        );

        const someCustomEmailPreferenceEnabled: boolean = pot.getOrElse(
          pot.mapNullable(potVisibleServices, services =>
            services
              .map(
                service =>
                  blockedChannels[service.service_id] &&
                  blockedChannels[service.service_id].indexOf("EMAIL") !== -1
              )
              .find(item => item)
          ),
          false
        );

        // If the email notification for visible services are partially disabled
        // (only for some services), the customization is enabled
        yield put(
          customEmailChannelSetEnabled(someCustomEmailPreferenceEnabled)
        );
      }
    }
  );
}
