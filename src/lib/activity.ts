import { get, writable } from 'svelte/store';
import { parseFeed } from '@rowanmanning/feed-parser';

const lastCommits = writable<Activity[]>([]);

export const updateCommits = async () => {
	try {
		const githubFeed = await parseFeedToActivity('https://github.com/90-008.atom');
		const codebergFeed = await parseFeedToActivity('https://codeberg.org/90-008.atom');
		const tangledFeed = await fetchTangledActivity();
		const mergedFeed = sortActivities(
			githubFeed.concat(codebergFeed).concat(tangledFeed)
		).slice(0, 7);
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

const toHex = (bytes: number[]): string => {
	return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const fetchTangledActivity = async (): Promise<Activity[]> => {
	const did = 'did:plc:dfl62fgb7wtjj3fcbb72naae';
	const pds = 'https://zwsp.xyz';
	const knot = 'https://knot.gaze.systems';
	const activities: Activity[] = [];

	try {
		const listRes = await fetch(
			`${pds}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=sh.tangled.repo`
		);
		if (!listRes.ok) return [];
		const listData = await listRes.json();

		for (const record of listData.records || []) {
			const repoName = record.value.name;
			if (!repoName) continue;

			try {
				const logRes = await fetch(
					`${knot}/xrpc/sh.tangled.repo.log?repo=${did}/${repoName}`
				);
				if (!logRes.ok) continue;
				const logData = await logRes.json();
				
				const commits = logData.commits || [];

				for (const commit of commits) {
					const hash = commit.Hash ? toHex(commit.Hash) : '';
					const message = commit.Message || '';
					const dateStr = commit.Author?.When;
					
					activities.push({
						source: 'tangled',
						description: `pushed ${repoName}: ${message}`,
						link: `https://tangled.sh/${did}/${repoName}/commit/${hash}`,
						date: dateStr ? new Date(dateStr) : null
					});
				}
			} catch (err) {
				console.log(`could not fetch tangled log for ${repoName}:`, err);
			}
		}
	} catch (err) {
		console.log('could not fetch tangled repos:', err);
	}
	return activities;
};

const parseFeedToActivity = async (url: string) => {
	const response = await fetch(url);
	const feed = parseFeed(await response.text());

	const source = new URL(url).host.split('.')[0];
	const results: Activity[] = [];
	for (const item of feed.items) {
		const description: string | null = item.description || item.title;
		if (description === null) continue;
		// dont count mirrored repos
		// TODO: probably can implement a deduplication algorithm
		if (
			['90-008/ark', '90-008/website', 'ark', 'website'].some((repo) =>
				description.includes(repo)
			)
		)
			continue;
		// dont show activity that is just chore
		if (item.content?.includes('chore')) continue;
		const desc = description.split('</a>').at(1) || description.split('</a>').pop() || '';
		results.push({
			source,
			description: desc.replace(/^90-008 /, ""),
			link: item.url,
			date: item.published || item.updated
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
