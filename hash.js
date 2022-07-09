const open = '6ab07062-ae74-4b42-';
const close = '-a323-3bbcd5758757';
export function setItem(id, obj) {
    const { hash } = location;
    const json = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    const idEncoded = btoa(id);
    const iPosOfStart = hash.indexOf(open + idEncoded);
    if (iPosOfStart > -1) {
        const iPosOfEnd = hash.indexOf(close, iPosOfStart);
        if (iPosOfEnd > -1) {
            let newHash = hash.substring(0, iPosOfStart + open.length + idEncoded.length);
            newHash += json;
            newHash += hash.substring(iPosOfEnd);
            location.hash = newHash;
            return;
        }
    }
    location.hash += open + idEncoded + json + close;
}
export function getItem(id) {
    const { hash } = location;
    const idEncoded = btoa(id);
    const iPosOfStart = hash.indexOf(open + idEncoded);
    if (iPosOfStart === -1)
        return null;
    const iPosOfEnd = hash.indexOf(close, iPosOfStart);
    if (iPosOfEnd === -1)
        return null;
    const json = JSON.parse(decodeURIComponent(escape(atob(hash.substring(iPosOfStart + open.length + idEncoded.length, iPosOfEnd)))));
    return json;
}
