import {_load as load_logs} from '../log/+page.server.ts'

export const load = (params) => {
    var url = params.url
    var log_id = url.searchParams.get("log_id")
    if (log_id !== null) {
        url.searchParams.append("id", log_id)
    }
    var log_page = url.searchParams.get("log_page")
    if (log_page !== null) {
        url.searchParams.append("page", log_page)
    }
    var logs_result = load_logs({url})
    return logs_result
}