import * as vscode from 'vscode';
import htmxData from '../htmx-data.json'; // Adjust the path to your actual JSON file

export function activate(context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerCompletionItemProvider('cfml', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            const line = document.lineAt(position);
            const linePrefix = line.text.substring(0, position.character);
            const swapMatch = linePrefix.match(/(hx-swap=["|'])([^"|']*)$/);

            if (swapMatch) {
                // Handle hx-swap completions
                return getSwapCompletionItems(document, position);
            } else {
                // Handle other HTMX attribute completions
                return getHtmxCompletionItems(document, position);
            }
        }
    }, '=', '"', "'"); // Trigger completion inside attributes

    context.subscriptions.push(provider);

    const hoverProvider = vscode.languages.registerHoverProvider('cfml', {
        provideHover(document, position) {
            const range = document.getWordRangeAtPosition(position, /hx-\w+/);
            if (!range) {
                return null;
            }
            const word = document.getText(range);
            const attrInfo = htmxData.globalAttributes.find(attr => attr.name === word);
            if (!attrInfo) {
                return null;
            }
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**${attrInfo.name}**: ${attrInfo.description.replace(/\n/g, '  \n')}`);
            attrInfo.references.forEach(ref => {
                markdown.appendMarkdown(`\n\n[More Info](${ref.url})`);
            });
            return new vscode.Hover(markdown);
        }
    });

    context.subscriptions.push(hoverProvider);
}

function getSwapCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
    const swapOptions = htmxData.valueSets.find(set => set.name === 'swap')?.values || [];
    return swapOptions.map(option =>
        createCompletionItem(
            option.name,
            vscode.CompletionItemKind.Value,
            document,
            position,
            option.description
        )
    );
}

function getHtmxCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
    return htmxData.globalAttributes.map(attr =>
        createCompletionItem(
            attr.name,
            vscode.CompletionItemKind.Property,
            document,
            position,
            attr.description
        )
    );
}

function createCompletionItem(
    label: string,
    kind: vscode.CompletionItemKind,
    document: vscode.TextDocument,
    position: vscode.Position,
    description: string
): vscode.CompletionItem {
    const completion = new vscode.CompletionItem(label, kind);
    completion.insertText = label + '=""';
    completion.documentation = new vscode.MarkdownString(description);

    // Calculate and set the range
    const line = document.lineAt(position);
    const linePrefix = line.text.substring(0, position.character);
    const match = linePrefix.match(/(hx-\w*)$/);
    if (match) {
        const startCharIndex = position.character - match[0].length;
        completion.range = new vscode.Range(position.line, startCharIndex, position.line, position.character);
    }

    return completion;
}



export function deactivate() {}
