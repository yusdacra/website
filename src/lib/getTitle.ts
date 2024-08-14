const getTitle = (path: string) => {
    let sl = path.split('/')
    sl = sl.splice(1)
    if (sl.length > 1) {
        sl[0] = sl[0][0]
    }
    const newPath = sl.join('/')
    return '[gazesystems /' + newPath + ']$'
}

export default getTitle;