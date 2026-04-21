const EXT_NAME = 'GitHub x Harvest'

async function GetLatestCommit() {
	let project = window.prompt('Project?', typeof(GITHUB_DEFAULT_PROJECT) == 'undefined' ? '' : GITHUB_DEFAULT_PROJECT)
	if (!project) throw new Error('Project is required')
	let branch = window.prompt('Branch?', typeof(GITHUB_DEFAULT_BRANCH) == 'undefined' ? '' : GITHUB_DEFAULT_BRANCH)
	if (!branch) throw new Error('Branch is required')

	let apiUrl = `https://api.github.com/repos/${GITHUB_ORG}/${project}/commits/${branch}`;
	let headers = {
		Authorization: `Bearer ${GITHUB_TOKEN}`,
		'X-GitHub-Api-Version': '2022-11-28',
	}
	try {
		let response = await fetch(apiUrl, { headers });
		if (!response.ok) {
			throw new Error(
				`GitHub API request failed with status ${response.status}`
			);
		}

		let commitDetails = await response.json();
		return commitDetails;
	} catch (error) {
		console.error('Error fetching commit details:', error.message);
		return null;
	}
}

async function GetMessageForHarvest() {
	let custom_note = window.prompt('Custom note?', '')
	
	return await GetLatestCommit().then((res) => {
		if (!res) {
			ToggleLoader(false);
			console.log('Failed to fetch commit details.');
			return null;
		}

		return {
			note: custom_note,
			message: res?.commit?.message,
			url: res?.html_url,
			sha: res?.sha,
		};
	})
		.catch(e => ToggleLoader(false));
}

async function UpdateLatestHarvest() {
	ToggleLoader(true)

	let accountId = HARVEST_ACCOUNT_ID;
	let commit = await GetMessageForHarvest();
	if (!commit) return
	return UpdateLatestTimeEntry(accountId, commit);
}

async function UpdateLatestTimeEntry(accountId, commit) {
	let apiUrl = `https://api.harvestapp.com/v2/time_entries`;
	let headers = {
		Authorization: `Bearer ${HARVEST_TOKEN}`,
		'Harvest-Account-ID': accountId,
		'Content-Type': 'application/json',
	}

	try {
		// Get the ID of the latest time entry
		let latestTimeEntryId = $('form.day-entry-editor').attr('data-analytics-day-entry-id')

		if (!latestTimeEntryId) {
			$('.entry-notes').html(commit.message)
			return ToggleLoader(false)
		}

		// Fetch the existing entry to carry over its fields
		let exEntry = await fetch(`${apiUrl}/${latestTimeEntryId}`, { method: 'GET', headers })
		if (!exEntry.ok) {
			throw new Error(`Harvest API get request failed with status ${exEntry.status}`);
		}
		let ex = await exEntry.json();

		// external_reference can only be set at creation time (POST), not via PATCH.
		// So we delete the existing entry and recreate it with all the same fields
		// plus the external_reference.
		let deleteResponse = await fetch(`${apiUrl}/${latestTimeEntryId}`, { method: 'DELETE', headers })
		if (!deleteResponse.ok) {
			throw new Error(`Harvest API delete request failed with status ${deleteResponse.status}`);
		}

		let notes = [ex.notes, commit.note, commit.message].filter(e=>e);
		let newEntry = {
			project_id: ex.project.id,
			task_id: ex.task.id,
			spent_date: ex.spent_date,
			hours: ex.hours_without_timer ?? ex.hours,
			notes: notes.join("\n\n").trim(),
			external_reference: {
				id: commit.sha,
				group_id: GITHUB_ORG,
				permalink: commit.url,
				service: 'GitHub',
			},
		}

		// Preserve start/end times if the entry used them
		if (ex.started_time) newEntry.started_time = ex.started_time
		if (ex.ended_time) newEntry.ended_time = ex.ended_time

		let createResponse = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(newEntry) })
		if (!createResponse.ok) {
			throw new Error(`Harvest API create request failed with status ${createResponse.status}`);
		}

		let createdEntry = await createResponse.json();
		console.log('Successfully recreated time entry with external_reference:', createdEntry);
		$('.js-close').click()
	} catch (error) {
		console.error('Error updating time entry:', error.message);
		ToggleLoader(false)
	}
}

function ToggleLoader(isVisible) {
	$('.day-entry-editor .form-loading').toggleClass('is-visible', isVisible)
}

function CreateGitHubActionButton() {
	let form = $('.day-entry-editor');
	if (form.length == 0) return;

	if ($('.github-time-entry').length > 0) return;

	if (!AreVariablesValid()) return

	let cont = form.find('.js-submit').parent();
	let git = `
	<a type="button" class="pds-button github-time-entry" style="margin-left: 1rem;">
	    <svg viewBox="0 0 16 16" style="width: 25px;" fill="white">
	    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
		</svg>
	</a>`;
	cont.append(git);
}

function AreVariablesValid() {
	let errors = [EXT_NAME]
	if (typeof (GITHUB_ORG) == 'undefined') errors.push('GITHUB_ORG is undefined - GitHub organisation endpoint slug')
	if (typeof (GITHUB_TOKEN) == 'undefined') errors.push('GITHUB_TOKEN is undefined - GitHub personal access token')
	if (typeof (HARVEST_TOKEN) == 'undefined') errors.push('HARVEST_TOKEN is undefined - Harvest API token')
	if (errors.length > 1) {
		console.error(errors.join('\n'))
		return false
	}
	return true
}

$(document).on('click', '.js-edit-entry, .js-new-time-entry', () => CreateGitHubActionButton());
$(document).on('click', '.github-time-entry', () => UpdateLatestHarvest());
$(document).on('load', '.day-entry-editor', () => console.log('form loaded'));
$(document).on('keydown', e => KeyDown(e));


function KeyDown(event) {
	let { which, altKey, metaKey } = event
	let char = String.fromCharCode(which).toLowerCase();

	if (altKey || metaKey)
		AltDown(event, char)
}

async function AltDown(event, char) {
	event.preventDefault();
	switch (char) {
		case 'g':
			$('.github-time-entry').trigger('click')
			break;
	}
}
