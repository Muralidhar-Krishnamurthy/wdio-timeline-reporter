"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const humanize_duration_1 = __importDefault(require("humanize-duration"));
const ResultsSummary = props => {
    const { total, passed, failed, skipped, duration, unknown } = props;
    return (react_1.default.createElement("div", { id: "filter", className: "container" },
        react_1.default.createElement("h3", { className: "title is-3" },
            react_1.default.createElement("span", { className: "has-text-grey-light" }, "Total Duration:"),
            ' ',
            humanize_duration_1.default(duration, { round: true })),
        react_1.default.createElement("div", { className: "columns summary" },
            react_1.default.createElement("div", { className: "column" },
                react_1.default.createElement("div", { "data-status": "all", className: "is-selected notification is-link" },
                    react_1.default.createElement("h1", { className: "title is-size-2" }, total),
                    react_1.default.createElement("p", { className: "title is-size-4" }, "Total"))),
            react_1.default.createElement("div", { className: "column" },
                react_1.default.createElement("div", { "data-status": "passed", className: "notification is-success" },
                    react_1.default.createElement("h1", { className: " title is-size-2" }, passed),
                    react_1.default.createElement("p", { className: "title is-size-4" }, "Passed"))),
            react_1.default.createElement("div", { className: "column" },
                react_1.default.createElement("div", { "data-status": "failed", className: "notification is-danger" },
                    react_1.default.createElement("h1", { className: "title is-size-2" }, failed),
                    react_1.default.createElement("p", { className: "title is-size-4" }, "Failed"))),
            react_1.default.createElement("div", { className: "column" },
                react_1.default.createElement("div", { "data-status": "skipped", className: "notification is-warning" },
                    react_1.default.createElement("h1", { className: "title is-size-2" }, skipped),
                    react_1.default.createElement("p", { className: "title is-size-4" }, "Skipped"))),
            !!unknown ? (react_1.default.createElement("div", { className: "column" },
                react_1.default.createElement("div", { className: "notification" },
                    react_1.default.createElement("h1", { className: "title is-size-2" }, unknown),
                    react_1.default.createElement("p", { className: "title is-size-4" }, "Unknown")))) : null)));
};
exports.default = ResultsSummary;
