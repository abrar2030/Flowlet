const React = require("react");

// Mock all exports from lucide-react to return a simple div with the icon name
const lucideReact = new Proxy(
  {},
  {
    get: (target, prop) => {
      if (prop === "__esModule") {
        return true;
      }
      return (props) =>
        React.createElement(
          "div",
          { "data-testid": `mock-icon-${String(prop)}`, ...props },
          String(prop),
        );
    },
  },
);

module.exports = lucideReact;
