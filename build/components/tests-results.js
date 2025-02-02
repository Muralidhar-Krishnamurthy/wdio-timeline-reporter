"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const error_1 = __importDefault(require("./error"));
const additional_context_1 = __importDefault(require("./additional-context"));
const warning_1 = __importDefault(require("./warning"));
const test_summary_1 = __importDefault(require("./test-summary"));
const images_container_1 = __importDefault(require("./images-container"));
const linkable_header_1 = require("./linkable-header");
const TestsResults = props => {
    const { tests } = props;
    return tests.map((test, index) => {
        const id = linkable_header_1.makeId(test.title);
        return (react_1.default.createElement("div", { key: index, className: `box test ${test.state}` },
            react_1.default.createElement(linkable_header_1.LinkableHeaderH5, { level: 5, id: id }, test.title),
            test.state === 'pending' ? (react_1.default.createElement("span", { className: "tag is-warning", style: { marginBottom: '18px' } }, "Failed mocha test configured to retry. Check spec result for final test run")) : null,
            react_1.default.createElement(test_summary_1.default, { test: test }),
            react_1.default.createElement(warning_1.default, { state: test.state }),
            react_1.default.createElement(images_container_1.default, { test: test }),
            react_1.default.createElement(error_1.default, { state: test.state, error: test.error }),
            react_1.default.createElement(additional_context_1.default, { context: test.context })));
    });
};
exports.default = TestsResults;
