/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */



import * as Fs from "fs";
import { XmlNode } from "../../../utils/XmlNode";
import { IarXml } from "../../../utils/xml";

export interface Define {
    readonly identifier: string;
    readonly value: string | undefined;
    /** Creates a string that cpptools can understand (e.g. 'MYMACRO=2') */
    makeString(): string;
}

enum DefinePart {
    Identifier,
    Value
}

abstract class BaseDefine implements Define {
    abstract identifier: string;
    abstract value: string | undefined;
    makeString(): string {
        const val = this.value ? this.value : "";
        return `${this.identifier}=${val}`;
    }
}

class XmlDefine extends BaseDefine {
    private readonly xmlData: XmlNode;

    constructor(xml: XmlNode) {
        super();
        this.xmlData = xml;

        if (xml.tagName !== "state") {
            throw new Error("Expected an xml element 'state' instead of '" + xml.tagName + "'.");
        } else {
            const identifier = this.parse(DefinePart.Identifier);

            if (!identifier || (identifier === "")) {
                throw new Error("Empty define.");
            }
        }
    }

    get identifier(): string {
        // The constructor does not allow an empty identifier
        return this.parse(DefinePart.Identifier) as string;
    }

    get value(): string | undefined {
        return this.parse(DefinePart.Value);
    }

    private parse(part: DefinePart): string | undefined {
        const define = this.xmlData.text;

        if (define) {
            const parts = define.split("=", 2);

            if (part === DefinePart.Identifier) {
                if (parts.length >= 1) {
                    return parts[0]?.trim();
                }
            } else if (part === DefinePart.Value) {
                if (parts.length >= 2) {
                    return parts[1]?.trim();
                }
            }
        }

        return undefined;
    }
}

class StringDefine extends BaseDefine {
    readonly identifier: string;
    readonly value: string | undefined;

    constructor(identifier: string, value: string | undefined) {
        super();
        this.identifier = identifier;
        this.value = value;
    }
}

export namespace Define {
    export function fromIdentifierValuePair(identifier: string, value: string): Define {
        return new StringDefine(identifier, value);
    }

    export function fromXml(configNode: XmlNode): Define[] {
        const settings = IarXml.findSettingsFromConfig(configNode, "/ICC.*/");

        if (settings) {
            const option = IarXml.findOptionFromSettings(settings, "CCDefines");

            if (option) {
                const states = option.getAllChildsByName("state");
                const defines: Define[] = [];

                states.forEach(state => {
                    try {
                        defines.push(new XmlDefine(state));
                    } catch (e) {
                    }
                });

                return defines;
            }
        }

        return [];
    }

    export function fromSourceFile(path: Fs.PathLike): Define[] {
        const buf = Fs.readFileSync(path.toString());

        return fromSourceData(buf);
    }

    export function fromSourceData(buf: Buffer): Define[] {
        const content = buf.toString();

        return fromSourceContent(content);
    }

    export function fromSourceContent(content: string): Define[] {
        const defines = new Array<Define>();

        const lines = content.split(/\r\n|\n/);

        lines.forEach(line => {
            if (line !== undefined) {
                const define = parseSourceLine(line);

                if (define) {
                    defines.push(define);
                }
            }
        });

        return defines;
    }

    function parseSourceLine(line: string): Define | undefined {
        const defineStart = "#define ";

        line = line.trim();

        if (line.startsWith(defineStart)) {
            line = line.substr(defineStart.length).trim();

            let identifier: string | undefined;
            let value: string | undefined = undefined;
            let currentPart = "";

            let brackets = 0;
            for (let idx = 0; idx < line.length; idx += 1) {
                if (line[idx] === "(") {
                    brackets += 1;
                } else if (line[idx] === ")") {
                    brackets -= 1;
                }

                /* When a space is found, check if there were no opening brackets as they define parameters of a
                   macro. In this case we should not store the current found data as an identifier, but keep reading
                   the next characters and add it to the identifier. Only when there are no opening brackets, we should
                   store the current read data as the identifier and start reading the value part */
                if ((line[idx] === " ") && (brackets === 0) && (identifier === undefined)) {
                    identifier = currentPart;
                    currentPart = "";
                } else {
                    currentPart += line[idx];
                }
            }

            /* It is possible we have only read spaces, so trim and check if there are characters left */
            currentPart = currentPart.trim();
            if (currentPart.length > 0) {
                if (identifier === undefined) {
                    identifier = currentPart;
                } else {
                    value = currentPart;
                }
            }

            if (identifier) {
                return new StringDefine(identifier, value);
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }
}
