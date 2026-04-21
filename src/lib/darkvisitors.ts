import { env } from '$env/dynamic/private';
import { DarkVisitors } from '@darkvisitors/sdk';

export const darkVisitors = new DarkVisitors(env.DARK_VISITORS_TOKEN!);
