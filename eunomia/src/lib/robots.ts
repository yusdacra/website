import { env } from '$env/dynamic/private';
import { get, writable } from 'svelte/store';
import { type Robot } from 'robots-parser';
import robotsParser from 'robots-parser';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { darkVisitors } from './darkvisitors';
import { AgentType } from '@darkvisitors/sdk';

const cachedParsedRobots = writable<Robot | null>(null);
const cachedRobots = writable<string>('');
const lastFetched = writable<number>(Date.now());

const fetchRobotsTxt = async () => {
	const robotsTxt = await darkVisitors.generateRobotsTxt([
		AgentType.AIAgent,
		AgentType.AIAssistant,
		AgentType.AIDataScraper,
		AgentType.AISearchCrawler,
		AgentType.UndocumentedAIAgent,
		AgentType.SEOCrawler
	]);
	lastFetched.set(Date.now());
	return robotsTxt;
};

export const getRobotsTxt = async () => {
	let robotsTxt = get(cachedRobots);
	if (robotsTxt.length === 0 || Date.now() - get(lastFetched) > 1000 * 60 * 60 * 24) {
		robotsTxt = await fetchRobotsTxt();
		cachedRobots.set(robotsTxt);
		cachedParsedRobots.set(robotsParser(`${PUBLIC_BASE_URL}/robots.txt`, robotsTxt));
	}
	return robotsTxt;
};

export const testUa = async (url: string, ua: string) => {
	if (ua.length === 0) return false;
	let parsedRobots = get(cachedParsedRobots);
	if (parsedRobots === null) {
		parsedRobots = robotsParser(`${PUBLIC_BASE_URL}/robots.txt`, await getRobotsTxt());
		cachedParsedRobots.set(parsedRobots);
	}
	return parsedRobots.isAllowed(url, ua);
};
