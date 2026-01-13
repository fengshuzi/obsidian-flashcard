import { ClozeCrafter, IClozeFormatter } from "clozecraft";

import { CardType } from "src/question";
import { SRSettings } from "src/settings";
import { findLineIndexOfSearchStringIgnoringWs } from "src/utils/strings";

export class CardFrontBack {
    front: string;
    back: string;

    // The caller is responsible for any required trimming of leading/trailing spaces
    constructor(front: string, back: string) {
        this.front = front;
        this.back = back;
    }
}

export class CardFrontBackUtil {
    static expand(
        questionType: CardType,
        questionText: string,
        settings: SRSettings,
    ): CardFrontBack[] {
        const handler: IQuestionTypeHandler = QuestionTypeFactory.create(questionType);
        return handler.expand(questionText, settings);
    }
}

export interface IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[];
}

class QuestionTypeSingleLineBasic implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        const idx: number = questionText.indexOf(settings.singleLineCardSeparator);
        const item: CardFrontBack = new CardFrontBack(
            questionText.substring(0, idx),
            questionText.substring(idx + settings.singleLineCardSeparator.length),
        );
        const result: CardFrontBack[] = [item];
        return result;
    }
}

class QuestionTypeSingleLineReversed implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        const idx: number = questionText.indexOf(settings.singleLineReversedCardSeparator);
        const side1: string = questionText.substring(0, idx),
            side2: string = questionText.substring(
                idx + settings.singleLineReversedCardSeparator.length,
            );
        const result: CardFrontBack[] = [
            new CardFrontBack(side1, side2),
            new CardFrontBack(side2, side1),
        ];
        return result;
    }
}

class QuestionTypeMultiLineBasic implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        // We don't need to worry about "\r\n", as multi line questions processed by parse() concatenates lines explicitly with "\n"
        const questionLines = questionText.split("\n");

        // 检查是否是 Logseq 格式 (包含 #flashcard 标签)
        if (questionLines[0] && /#flashcard\b/i.test(questionLines[0])) {
            return this.expandLogseqFormat(questionLines);
        }

        // 原有的多行格式处理
        const lineIdx = findLineIndexOfSearchStringIgnoringWs(
            questionLines,
            settings.multilineCardSeparator,
        );
        const side1: string = questionLines.slice(0, lineIdx).join("\n");
        const side2: string = questionLines.slice(lineIdx + 1).join("\n");

        const result: CardFrontBack[] = [new CardFrontBack(side1, side2)];
        return result;
    }

    /**
     * 处理 Logseq 格式的闪卡
     * 格式: - question #flashcard
     *         answer line 1
     *         answer line 2
     *       <!--SR:!2025-12-22,4,270-->
     */
    private expandLogseqFormat(questionLines: string[]): CardFrontBack[] {
        // 第一行是问题（移除 #flashcard 标签和列表标记）
        const front = questionLines[0]
            .replace(/^\s*-\s+/, "") // 移除列表标记
            .replace(/#flashcard\b/gi, "") // 移除 #flashcard 标签
            .replace(/<!--SR:.*?-->/g, "") // 移除 SR 调度信息
            .trim();

        // 剩余行是答案（移除 SR 调度信息和列表标记）
        const answerLines: string[] = [];
        for (let i = 1; i < questionLines.length; i++) {
            const line = questionLines[i];
            // 跳过 SR 调度信息行
            if (line.includes("<!--SR:")) continue;
            // 跳过空行
            if (line.trim().length === 0) continue;
            // 移除列表标记并保留内容
            const cleanedLine = line.replace(/^\s*-\s+/, "  ").trimEnd();
            answerLines.push(cleanedLine);
        }

        const back = answerLines.join("\n").trim();

        const result: CardFrontBack[] = [new CardFrontBack(front, back)];
        return result;
    }
}

class QuestionTypeMultiLineReversed implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        // We don't need to worry about "\r\n", as multi line questions processed by parse() concatenates lines explicitly with "\n"
        const questionLines = questionText.split("\n");
        const lineIdx = findLineIndexOfSearchStringIgnoringWs(
            questionLines,
            settings.multilineReversedCardSeparator,
        );
        const side1: string = questionLines.slice(0, lineIdx).join("\n");
        const side2: string = questionLines.slice(lineIdx + 1).join("\n");

        const result: CardFrontBack[] = [
            new CardFrontBack(side1, side2),
            new CardFrontBack(side2, side1),
        ];
        return result;
    }
}

class QuestionTypeCloze implements IQuestionTypeHandler {
    expand(questionText: string, settings: SRSettings): CardFrontBack[] {
        const clozecrafter = new ClozeCrafter(settings.clozePatterns);
        const clozeNote = clozecrafter.createClozeNote(questionText);
        const clozeFormatter = new QuestionTypeClozeFormatter();

        let front: string, back: string;
        const result: CardFrontBack[] = [];
        for (let i = 0; i < clozeNote.numCards; i++) {
            front = clozeNote.getCardFront(i, clozeFormatter);
            back = clozeNote.getCardBack(i, clozeFormatter);
            result.push(new CardFrontBack(front, back));
        }

        return result;
    }
}

export class QuestionTypeClozeFormatter implements IClozeFormatter {
    asking(answer?: string, hint?: string): string {
        return `<span style='color:#2196f3'>${!hint ? "[...]" : `[${hint}]`}</span>`;
    }

    showingAnswer(answer: string, _hint?: string): string {
        return `<span style='color:#2196f3'>${answer}</span>`;
    }

    hiding(answer?: string, hint?: string): string {
        return `<span style='color:var(--code-comment)'>${!hint ? "[...]" : `[${hint}]`}</span>`;
    }
}

export class QuestionTypeFactory {
    static create(questionType: CardType): IQuestionTypeHandler {
        let handler: IQuestionTypeHandler;
        switch (questionType) {
            case CardType.SingleLineBasic:
                handler = new QuestionTypeSingleLineBasic();
                break;
            case CardType.SingleLineReversed:
                handler = new QuestionTypeSingleLineReversed();
                break;
            case CardType.MultiLineBasic:
                handler = new QuestionTypeMultiLineBasic();
                break;
            case CardType.MultiLineReversed:
                handler = new QuestionTypeMultiLineReversed();
                break;
            case CardType.Cloze:
                handler = new QuestionTypeCloze();
                break;
        }
        return handler;
    }
}
