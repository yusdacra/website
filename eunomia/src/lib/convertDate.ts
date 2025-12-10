const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];

const convertDate = (published: string) => {
    const date = published.substring(0, 10);
    const [year, month, day] = date.split('-');
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
};

export default convertDate;