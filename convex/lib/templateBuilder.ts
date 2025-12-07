
import { TemplateType } from './templateTypes';

export function buildMetaTemplatePayload(template: any) {
    const components: any[] = [];

    // Header
    if (template.header) {
        const header: any = {
            type: "HEADER",
            format: template.header.type
        };

        if (template.header.type === 'TEXT' && template.header.text) {
            header.text = template.header.text;
        } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(template.header.type)) {
            // Media headers usually need an example in submission
            if (template.header.example) {
                header.example = {
                    header_handle: [template.header.example.mediaUrl] // This usually needs a handle from a session, simplistic for now
                };
            }
        }
        components.push(header);
    }

    // Body
    if (template.body) {
        const body: any = {
            type: "BODY",
            text: template.body
        };
        if (template.bodyExamples && template.bodyExamples.length > 0) {
            body.example = {
                body_text: [template.bodyExamples]
            };
        }
        components.push(body);
    }

    // Footer
    if (template.footer) {
        components.push({
            type: "FOOTER",
            text: template.footer
        });
    }

    // Buttons
    if (template.buttons && template.buttons.length > 0) {
        const buttons = template.buttons.map((btn: any) => {
            if (btn.type === 'QUICK_REPLY') {
                return {
                    type: "QUICK_REPLY",
                    text: btn.text
                };
            } else if (btn.type === 'URL') {
                return {
                    type: "URL",
                    text: btn.text,
                    url: btn.url
                };
            } else if (btn.type === 'PHONE_NUMBER') {
                return {
                    type: "PHONE_NUMBER",
                    text: btn.text,
                    phone_number: btn.phoneNumber
                };
            } else if (btn.type === 'COPY_CODE') {
                return {
                    type: "COPY_CODE",
                    example: "CODE123" // Placeholder or from config
                };
            }
            return null;
        }).filter(Boolean);

        components.push({
            type: "BUTTONS",
            buttons: buttons
        });
    }

    // Special Configs (Carousel, etc.) implementation would go here
    // ...

    return {
        name: template.name,
        category: template.category,
        language: template.language,
        components: components
    };
}
