import React from 'react';
import { cn } from '@/lib/utils';
import { TemplateTypeConfig } from '@/convex/lib/templateTypes';

interface TemplatePreviewProps {
    data: {
        header?: { type: string; text?: string; url?: string };
        body: string;
        footer?: string;
        buttons?: any[];
        sections?: any[];
        cards?: any[];
    };
    config: TemplateTypeConfig;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ data, config }) => {
    const { header, body, footer, buttons, sections, cards } = data;

    // Helper to replace variables {{1}} with sample data or highlights
    const formatBody = (text: string) => {
        if (!text) return '';
        return text.split(/(\{\{\d+\}\})/).map((part, i) => {
            if (part.match(/\{\{\d+\}\}/)) {
                return <span key={i} className="bg-yellow-200 px-1 rounded text-xs mx-0.5 border border-yellow-300 text-yellow-800 font-mono">{part}</span>;
            }
            return part;
        });
    };

    const renderHeader = (h: any) => {
        if (!h || h.type === 'NONE') return null;
        return (
            <div className="mb-2">
                {h.type === 'TEXT' && (
                    <div className="font-bold text-sm text-gray-900">{h.text}</div>
                )}
                {h.type === 'IMAGE' && (
                    <div className="h-32 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs overflow-hidden">
                        {h.url ? (
                            h.url.includes('{{') ? (
                                <div className="flex flex-col items-center justify-center p-2 text-center">
                                    <span className="font-mono text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">
                                        DYNAMIC IMAGE
                                    </span>
                                    <span className="text-[10px] mt-1 opacity-70 truncate max-w-[200px]">{h.url}</span>
                                </div>
                            ) : (
                                <img src={h.url} alt="Header" className="w-full h-full object-cover" />
                            )
                        ) : (
                            <span>IMAGE</span>
                        )}
                    </div>
                )}
                {h.type === 'VIDEO' && (
                    <div className="h-32 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs overflow-hidden">
                        {h.url ? (
                            h.url.includes('{{') ? (
                                <div className="flex flex-col items-center justify-center p-2 text-center">
                                    <span className="font-mono text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">
                                        DYNAMIC VIDEO
                                    </span>
                                    <span className="text-[10px] mt-1 opacity-70 truncate max-w-[200px]">{h.url}</span>
                                </div>
                            ) : (
                                <video src={h.url} className="w-full h-full object-cover" controls={false} />
                            )
                        ) : (
                            <span>VIDEO</span>
                        )}
                    </div>
                )}
                {h.type === 'DOCUMENT' && (
                    <div className="h-16 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs border">
                        {h.url ? 'DOCUMENT (LINKED)' : 'DOCUMENT'}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full max-w-sm mx-auto border rounded-[30px] overflow-hidden bg-[#E2E1DE] shadow-xl relative h-[600px] flex flex-col">
            {/* Status Bar Mock */}
            <div className="bg-[#E2E1DE] px-5 py-3 flex justify-between items-center text-xs font-medium text-gray-800">
                <span>9:41</span>
                <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-800"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-800"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-800"></div>
                </div>
            </div>

            {/* Header Mock */}
            <div className="bg-[#E2E1DE] px-4 py-2 flex items-center gap-3 border-b border-gray-300/50">
                <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                <div className="flex-1">
                    <div className="font-semibold text-sm">WhatsApp Business</div>
                </div>
            </div>

            {/* Chat Area */}
            <div
                className="flex-1 p-4 overflow-y-auto bg-repeat scrollbar-hide"
                style={{
                    backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                    backgroundSize: '300px'
                }}
            >
                {/* CAROUSEL VIEW */}
                {config.type === 'CAROUSEL' ? (
                    <div className="flex gap-2 overflow-x-auto pb-4 snap-x">
                        {(cards && cards.length > 0 ? cards : [{ body: '' }]).map((card: any, idx: number) => (
                            <div key={idx} className="min-w-[80%] max-w-[80%] flex flex-col snap-center">
                                <div className="bg-white rounded-lg p-3 shadow-sm relative">
                                    {card.headerUrl && (
                                        <div className="h-32 bg-gray-200 rounded mb-2 overflow-hidden flex items-center justify-center bg-gray-100">
                                            {card.headerUrl.includes('{{') ? (
                                                <div className="flex flex-col items-center justify-center p-2 text-center">
                                                    <span className="font-mono text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">
                                                        DYNAMIC MEDIA
                                                    </span>
                                                </div>
                                            ) : (
                                                <img src={card.headerUrl} className="w-full h-full object-cover" alt="Card Header" />
                                            )}
                                        </div>
                                    )}
                                    {card.title && (
                                        <div className="font-bold text-sm text-gray-900 mb-1">{card.title}</div>
                                    )}
                                    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {card.body ? formatBody(card.body) : <span className="text-gray-400 italic">Carte {idx + 1}...</span>}
                                    </div>
                                    {/* Carousel cards don't typically have standard footers, but they have buttons */}
                                    <div className="absolute top-0 -left-2 w-0 h-0 border-t-10 border-t-white border-l-10 border-l-transparent transform rotate-90 opacity-0" />
                                </div>

                                {card.buttons && card.buttons.length > 0 && (
                                    <div className="mt-1 space-y-1">
                                        {card.buttons.map((btn: any, i: number) => (
                                            <div key={i} className="bg-white rounded text-center py-2 text-[#00A5F4] text-sm shadow-sm font-medium">
                                                {btn.text || 'Bouton'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* STANDARD & LIST VIEW */
                    <>
                        <div className="bg-white rounded-lg p-3 shadow-sm max-w-[90%] relative">
                            {/* Header */}
                            {config.features.hasHeader && renderHeader(header)}

                            {/* Body */}
                            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {body ? formatBody(body) : <span className="text-gray-400 italic">Votre message apparaîtra ici...</span>}
                            </div>

                            {/* Footer */}
                            {config.features.hasFooter && footer && (
                                <div className="mt-2 text-xs text-gray-500">
                                    {footer}
                                </div>
                            )}

                            {/* Timestamp */}
                            <div className="flex justify-end mt-1">
                                <span className="text-[10px] text-gray-400">10:00 AM</span>
                            </div>

                            {/* Triangle Tail */}
                            <div className="absolute top-0 -left-2 w-0 h-0 border-t-10 border-t-white border-l-10 border-l-transparent transform rotate-90" />
                        </div>

                        {/* LIST MENU BUTTON */}
                        {config.type === 'LIST' && buttons && buttons.length > 0 && (
                            <div className="mt-1 max-w-[90%]">
                                <div className="bg-white rounded text-center py-2 text-[#00A5F4] text-sm shadow-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                    <span className="text-xs">☰</span> {buttons[0].text || 'Menu'}
                                </div>
                            </div>
                        )}

                        {/* STANDARD BUTTONS */}
                        {config.type !== 'LIST' && buttons && buttons.length > 0 && (
                            <div className="mt-1 space-y-1 max-w-[90%]">
                                {buttons.map((btn: any, i: number) => (
                                    <div key={i} className="bg-white rounded text-center py-2 text-[#00A5F4] text-sm shadow-sm font-medium cursor-pointer hover:bg-gray-50">
                                        {btn.type === 'PHONE_NUMBER' && '📞 '}
                                        {btn.type === 'URL' && '🔗 '}
                                        {btn.text || 'Bouton'}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Area Mock */}
            <div className="bg-[#F0F2F5] p-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white"></div>
                <div className="flex-1 h-8 bg-white rounded-full"></div>
                <div className="w-8 h-8 rounded-full bg-teal-600"></div>
            </div>
        </div>
    );
};
