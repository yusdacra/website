export const renderRelativeDate = (timestamp: number) => {
    const elapsed = timestamp - (new Date()).getTime()
    const units: Record<string, number> = {
        year  : 24 * 60 * 60 * 1000 * 365,
        month : 24 * 60 * 60 * 1000 * 365/12,
        day   : 24 * 60 * 60 * 1000,
        hour  : 60 * 60 * 1000,
        minute: 60 * 1000,
        second: 1000
    }
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    for (var unit in units)
        if (Math.abs(elapsed) > units[unit] || unit == 'second')
            return rtf.format(Math.round(elapsed / units[unit]), unit as Intl.RelativeTimeFormatUnit)
    return ""
}
export const renderDate = (timestamp: number) => {
    return (new Date(timestamp)).toLocaleString("en-GB", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
}