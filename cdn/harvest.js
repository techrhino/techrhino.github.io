async function GetLatestCommit() {
	let project = window.prompt('Project?')
	if(!project) throw new Error('Project is required')
	let branch = window.prompt('Branch?')
	if(!branch) throw new Error('Branch is required')
	
	let apiUrl = `https://api.github.com/repos/processpro/${project}/commits/${branch}`;
	let headers = {
				Authorization: `Bearer ${GITHUB}`,
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
	return await GetLatestCommit().then((res) => {
		if (!res) return console.log('Failed to fetch commit details.');

		let msg = res?.commit?.message;
		let url = res?.html_url;
		return msg + '\n' + url;
	})
	.catch(e=> ToggleLoader(false));
}

async function UpdateLatestHarvest() {
	ToggleLoader(true)
	
	let accountId = '1525466';
	let note = await GetMessageForHarvest();
	if(!note) return
	return UpdateLatestTimeEntry(accountId, note);
}

async function UpdateLatestTimeEntry(accountId, notes) {
	let apiUrl = `https://api.harvestapp.com/v2/time_entries`;
	let headers = {
				Authorization: `Bearer ${HARVEST}`,
				'Harvest-Account-ID': accountId,
				'Content-Type': 'application/json',
			}
	
	try {
		// Get the ID of the latest time entry
		let latestTimeEntryId = $('form.day-entry-editor').attr('data-analytics-day-entry-id')
		
		if(!latestTimeEntryId){
			$('.entry-notes').html(notes)
			return ToggleLoader(false)
		}
		
		let exEntry = await fetch(`${apiUrl}/${latestTimeEntryId}`,{ method: 'GET', headers })
		if (!exEntry.ok) {
			throw new Error(
				`Harvest API get request failed with status ${exEntry.status}`
			);
		}
		let exEntryData = await exEntry.json();
		
		// Update the latest time entry with new data
		let opts = { method: 'PATCH', headers, body: JSON.stringify({ notes: [exEntryData.notes, notes].join("\n\n")})}
		let updateResponse = await fetch(`${apiUrl}/${latestTimeEntryId}`, opts);
		if (!updateResponse.ok) {
			throw new Error(
				`Harvest API update request failed with status ${updateResponse.status}`
			);
		}

		let updatedTimeEntryData = await updateResponse.json();
		console.log(
			'Successfully updated the latest time entry:',
			updatedTimeEntryData
		);
		$('.js-close').click()
	} catch (error) {
		console.error('Error updating time entry:', error.message);
	}
}

function ToggleLoader(isVisible){
	$('.day-entry-editor .form-loading').toggleClass('is-visible', isVisible)
}

function CreateGitHubActionButton() {
	let form = $('.day-entry-editor');
	if (form.length == 0) return;

	if ($('.github-time-entry').length > 0) return;

	let cont = form.find('.js-submit').parent();
	let git = `
	<a type="button" class="pds-button github-time-entry" style="margin-left: 1rem;">
	    <svg viewBox="0 0 16 16" style="width: 25px;" fill="white">
	    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
		</svg>
	</a>`;
	cont.append(git);
}

$(document).on('click', '.github-time-entry', () => UpdateLatestHarvest());
$(document).on('load', '.day-entry-editor', () => console.log('form loaded'));
