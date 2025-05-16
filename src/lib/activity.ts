import { get, writable } from 'svelte/store';
import { parseFeed } from '@rowanmanning/feed-parser';

const lastCommits = writable<Activity[]>([]);

export const updateCommits = async () => {
	try {
		const forgejoFeed = await parseFeedToActivity('https://git.gaze.systems/90008.rss');
		const githubFeed = await parseFeedToActivity('https://github.com/yusdacra.atom');
		const mergedFeed = sortActivities(forgejoFeed.concat(githubFeed)).slice(0, 7);
		lastCommits.set(mergedFeed);
	} catch (why) {
		console.log('could not fetch git activity: ', why);
	}
};

export const getLastActivity = () => {
	return get(lastCommits);
};

type Activity = {
	source: string;
	description: string;
	link: string | null;
	date: Date | null;
};

const parseFeedToActivity = async (url: string) => {
	const response = await fetch(url);
	const feed = parseFeed(await response.text());

	const source = new URL(url).host;
	const results: Activity[] = [];
	for (const item of feed.items) {
		const description: string | null = item.description || item.title;
		if (description === null) continue;
		// dont count mirrored repos
		// TODO: probably can implement a deduplication algorithm
		if (description.includes('yusdacra/ark') || description.includes('yusdacra/website')) continue;
		// dont show activity that is just update flake deps or something
		if (item.content?.includes('update flake deps') || item.content?.includes('chore(deps)'))
			continue;
		results.push({
			source,
			description: description.split('</a>').pop() || '',
			link: item.url,
			date: item.published
		});
	}

	return results;
};

const sortActivities = (activities: Array<Activity>) => {
	return activities.sort((a, b) => {
		if (a.date === null && b.date === null) return 0;
		if (a.date === null) return 1;
		if (b.date === null) return -1;
		return b.date.getTime() - a.date.getTime();
	});
};
