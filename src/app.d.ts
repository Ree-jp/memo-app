/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		interface Locals {
			user: { id: number; username: string } | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				STORAGE: R2Bucket;
				AUTH_SECRET: string;
			};
		}
	}
}

export {};
