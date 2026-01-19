export interface ParsedRemark {
    size: string;
    adds: string[];
    presets: string[];
    note: string;
}

/**
 * Global utility to parse product remarks for Kitchen and Admin views.
 * Handles: [Size: Small], + Extra Egg, [Sugar: 50%], and manual notes.
 */
export const parseItemRemark = (remark: string | null | undefined): ParsedRemark => {
    if (!remark) return { size: '', adds: [], presets: [], note: '' };

    let currentRemark = remark;

    // 1. Extract Size (e.g., [Size: ចានតូច])
    const sizeMatch = currentRemark.match(/\[Size:\s*([^\]]+)\]/i);
    const size = sizeMatch ? sizeMatch[1].trim() : '';
    if (sizeMatch) currentRemark = currentRemark.replace(sizeMatch[0], '');

    // 2. Extract Additions starting with '+' (e.g., + Egg, + Cheese)
    const addSectionMatch = currentRemark.match(/\+\s*([^\[]+)/);
    let adds: string[] = [];
    if (addSectionMatch) {
        adds = addSectionMatch[1].split(',').map(a => a.trim()).filter(Boolean);
        currentRemark = currentRemark.replace(addSectionMatch[0], '');
    }

    // 3. Extract Bracketed Presets (e.g., [Sugar Level: 70%])
    const tagRegex = /\[([^\]]+)\]/g;
    const presetsMatch = currentRemark.match(tagRegex) || [];
    const presets = presetsMatch.map(p => p.replace(/[\[\]]/g, '').trim()).filter(Boolean);
    currentRemark = currentRemark.replace(tagRegex, '');

    // 4. Remaining text is the manual Kitchen Note
    const note = currentRemark.trim();

    return { size, adds, presets, note };
};