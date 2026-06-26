#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const DEFAULT_COMMIT_MESSAGE = "Publish blog updates";
const EXPECTED_BRANCH = "main";
const FULL_MODE_FLAG = "--full";

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		stdio: options.capture ? "pipe" : "inherit",
		encoding: "utf8",
		shell: false,
	});

	if (result.status !== 0) {
		const commandText = [command, ...args].join(" ");
		throw new Error(`Command failed: ${commandText}`);
	}

	return options.capture ? result.stdout.trim() : "";
}

function getOptions() {
	const args = process.argv.slice(2);
	const full = args.includes(FULL_MODE_FLAG);
	const messageArgs = args.filter((arg) => arg !== FULL_MODE_FLAG);
	const message = messageArgs.join(" ").trim();

	return {
		full,
		message: message || DEFAULT_COMMIT_MESSAGE,
	};
}

function getCommitMessage(options) {
	const message = options.message.trim();
	return message || DEFAULT_COMMIT_MESSAGE;
}

function getStatus() {
	return run("git", ["status", "--short"], { capture: true });
}

async function confirmPublish(status) {
	console.log("Changed files:");
	console.log(status);
	console.log("");

	const rl = createInterface({ input, output });
	const answer = await rl.question("Publish these changes? [y/N] ");
	rl.close();

	if (!["y", "yes"].includes(answer.trim().toLowerCase())) {
		console.log("Publish cancelled.");
		process.exit(0);
	}
}

async function main() {
	const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
		capture: true,
	});

	if (branch !== EXPECTED_BRANCH) {
		throw new Error(`Please switch to ${EXPECTED_BRANCH} before publishing.`);
	}

	const initialStatus = getStatus();
	if (!initialStatus) {
		console.log("No changes to publish.");
		return;
	}

	await confirmPublish(initialStatus);

	const options = getOptions();

	if (options.full) {
		run("pnpm", ["check"]);
		run("pnpm", ["build"]);
	} else {
		console.log("Quick publish mode: skipping pnpm check and pnpm build.");
	}

	run("git", ["add", "-A"]);

	const stagedClean = spawnSync("git", ["diff", "--cached", "--quiet"], {
		stdio: "ignore",
		shell: false,
	});

	if (stagedClean.status === 0) {
		console.log("No staged changes to commit.");
		return;
	}

	const commitMessage = getCommitMessage(options);
	run("git", ["commit", "-m", commitMessage]);
	run("git", ["push", "origin", EXPECTED_BRANCH]);

	console.log(
		`${options.full ? "Full" : "Quick"} publish complete. GitHub Pages and Cloudflare Pages will deploy automatically.`,
	);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
