import brRule from "./br";
import emRule from "./em";
import headingRule from "./heading";
import linkRule from "./link";
import listRule from "./list";
import newlineRule from "./newline";
import paragraphRule from "./paragraph";
import strongRule from "./strong";
import textRule from "./text";

const rules = {
  br: brRule,
  em: emRule,
  heading: headingRule,
  link: linkRule,
  list: listRule,
  newline: newlineRule,
  paragraph: paragraphRule,
  strong: strongRule,
  text: textRule
};

export default rules;
