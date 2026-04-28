const EXT_NAME = 'GitHub x Harvest'

// ─── Configuration validation ────────────────────────────────────────────────

function AreVariablesValid() {
	let errors = [EXT_NAME]
	if (typeof (GITHUB_ORG) == 'undefined') errors.push('GITHUB_ORG is undefined - GitHub organisation endpoint slug')
	if (typeof (GITHUB_TOKEN) == 'undefined') errors.push('GITHUB_TOKEN is undefined - GitHub personal access token')
	if (typeof (HARVEST_TOKEN) == 'undefined') errors.push('HARVEST_TOKEN is undefined - Harvest API token')
	if (typeof (HARVEST_ACCOUNT_ID) == 'undefined') errors.push('HARVEST_ACCOUNT_ID is undefined - Harvest account ID')
	if (typeof (GEMINI_TOKEN) == 'undefined') errors.push('GEMINI_TOKEN is undefined - Google Gemini API key')
	if (errors.length > 1) {
		console.error(errors.join('\n'))
		return false
	}
	return true
}

// ─── UI ──────────────────────────────────────────────────────────────────────

function ToggleLoader(isVisible) {
	$('.day-entry-editor .form-loading').toggleClass('is-visible', isVisible)
}

function InjectButtons() {
	let form = $('.day-entry-editor');
	if (form.length == 0) return;
	if ($('.github-time-entry').length > 0) return;
	if (!AreVariablesValid()) return

	let cont = form.find('.js-submit').parent();
	cont.append(`
		<a type="button" class="pds-button github-time-entry" style="margin-left: 1rem;" title="Link latest GitHub commit">
			<svg viewBox="0 0 16 16" style="width: 25px;" fill="white">
				<path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
			</svg>
		</a>
		<a type="button" class="pds-button harvest-link-entry" style="margin-left: 0.5rem;" title="Link external URL">
			<svg viewBox="0 0 16 16" style="width: 25px;" fill="white">
				<path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0z"/>
			</svg>
		</a>
		<a type="button" class="pds-button harvest-enhance-entry" style="margin-left: 0.5rem;" title="Enhance notes with AI">
			<svg viewBox="0 0 16 16" style="width: 25px;" fill="white">
				<path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.454 1.8 1.47 3.04l-5.946 7.355a1.516 1.516 0 0 1-2.437-1.713L7.15 10.5H5.027c-1.57 0-2.454-1.8-1.47-3.04L9.504.43z"/>
			</svg>
		</a>
	`);
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

async function FetchLatestCommit(project, branch) {
	let response = await fetch(`https://api.github.com/repos/${GITHUB_ORG}/${project}/commits/${branch}`, {
		headers: {
			Authorization: `Bearer ${GITHUB_TOKEN}`,
			'X-GitHub-Api-Version': '2022-11-28',
		}
	})
	if (!response.ok) throw new Error(`GitHub API request failed with status ${response.status}`)
	return response.json()
}

async function PromptForCommit() {
	let project = window.prompt('Project?', typeof GITHUB_DEFAULT_PROJECT != 'undefined' ? GITHUB_DEFAULT_PROJECT : '')
	if (!project) throw new Error('Project is required')
	let branch = window.prompt('Branch?', typeof GITHUB_DEFAULT_BRANCH != 'undefined' ? GITHUB_DEFAULT_BRANCH : '')
	if (!branch) throw new Error('Branch is required')
	let note = window.prompt('Custom Note?', '')

	let commit = await FetchLatestCommit(project, branch)
	return {
		note,
		message: commit?.commit?.message,
		url: commit?.html_url,
		sha: commit?.sha,
	}
}

async function PromptForLink() {
	let url = window.prompt('URL to link?', '')
	if (!url) return null
	let note = window.prompt('Note?', '')

	let id
	try {
		id = new URL(url).pathname.replace(/\//g, '-').replace(/^-|-$/g, '') || 'link'
	} catch {
		id = 'link'
	}

	return { note, message: null, url, sha: id }
}

// ─── Harvest API ──────────────────────────────────────────────────────────────

function HarvestHeaders() {
	return {
		Authorization: `Bearer ${HARVEST_TOKEN}`,
		'Harvest-Account-ID': HARVEST_ACCOUNT_ID,
		'Content-Type': 'application/json',
	}
}

async function HarvestFetch(path, options = {}) {
	let response = await fetch(`https://api.harvestapp.com/v2${path}`, {
		...options,
		headers: HarvestHeaders(),
	})
	if (!response.ok) throw new Error(`Harvest API ${options.method ?? 'GET'} ${path} failed with status ${response.status}`)
	return options.method === 'DELETE' ? null : response.json()
}

async function GetTimeEntry(id) {
	return HarvestFetch(`/time_entries/${id}`)
}

async function GetLastTimeEntry() {
	let data = await HarvestFetch('/time_entries?per_page=1')
	return data.time_entries?.[0] ?? null
}

async function CreateTimeEntry(body) {
	return HarvestFetch('/time_entries', { method: 'POST', body: JSON.stringify(body) })
}

async function PatchTimeEntry(id, body) {
	return HarvestFetch(`/time_entries/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

async function DeleteTimeEntry(id) {
	return HarvestFetch(`/time_entries/${id}`, { method: 'DELETE' })
}

// ─── Time entry actions ───────────────────────────────────────────────────────

function GetOpenEntryId() {
	return $('form.day-entry-editor').attr('data-analytics-day-entry-id')
}

function GetOpenEntryNotes() {
	return $('form.day-entry-editor textarea[name="notes"]').val()?.trim()
}

function SetOpenEntryNotes(notes) {
	$('form.day-entry-editor textarea[name="notes"]').val(notes).trigger('input')
}

async function LinkReference(ref) {
	ToggleLoader(true)
	try {
		let entryId = GetOpenEntryId()
		let base = {
			external_reference: {
				id: ref.sha,
				group_id: GITHUB_ORG,
				permalink: ref.url,
				service: 'GitHub',
			},
			hours: 0,
		}

		if (!entryId) {
			// No entry open — inherit project/task from most recent and use today's date
			let last = await GetLastTimeEntry()
			if (!last) throw new Error('No existing time entries found to inherit project/task from')

			await CreateTimeEntry({
				...base,
				project_id: last.project.id,
				task_id: last.task.id,
				spent_date: new Date().toISOString().split('T')[0],
				notes: [ref.note, ref.message].filter(Boolean).join("\n\n").trim(),
			})
		} else {
			let ex = await GetTimeEntry(entryId)
			let sharedFields = {
				project_id: ex.project.id,
				task_id: ex.task.id,
				spent_date: ex.spent_date,
			}

			if (ex.external_reference) {
				// Already has a reference — create a zero-time satellite entry
				let created = await CreateTimeEntry({
					...base,
					...sharedFields,
					notes: [`See parent entry #${entryId}`, ref.note, ref.message].filter(Boolean).join("\n\n").trim(),
				})
				let createdWithRef = await PatchTimeEntry(created.id, { notes: [`Ref: #${created.id}`, created.notes].filter(Boolean).join("\n\n") })

				// Cross-reference both entries
				await PatchTimeEntry(entryId, {
					notes: [ex.notes, `See satellite entry #${created.id}`].filter(Boolean).join("\n\n").trim()
				})
			} else {
				// No reference yet — try PATCH first to preserve list position
				let patched = await HarvestFetch(`/time_entries/${entryId}`, {
					method: 'PATCH',
					body: JSON.stringify({ external_reference: base.external_reference }),
				}).catch(() => null)

				if (patched) {
					let notes = [ex.notes, ref.note, ref.message].filter(Boolean)
					await PatchTimeEntry(entryId, {
						notes: [`Ref: #${entryId}`, ...notes].filter(Boolean).join("\n\n").trim()
					})
				} else {
					// PATCH rejected — fall back to delete-recreate
					console.warn('Harvest PATCH rejected external_reference, falling back to delete-recreate')
					await DeleteTimeEntry(entryId)

					let created = await CreateTimeEntry({
						...base,
						...sharedFields,
						hours: ex.hours_without_timer ?? ex.hours,
						notes: [ex.notes, ref.note, ref.message].filter(Boolean).join("\n\n").trim(),
						...(ex.started_time && { started_time: ex.started_time }),
						...(ex.ended_time && { ended_time: ex.ended_time }),
					})
					await PatchTimeEntry(created.id, {
						notes: [`Ref: #${created.id}`, created.notes].filter(Boolean).join("\n\n")
					})
				}
			}
		}

		$('.js-close').click()
	} catch (error) {
		console.error('Error linking reference:', error.message)
		ToggleLoader(false)
	}
}

async function EnhanceNotes() {
	let entryId = GetOpenEntryId()
	if (!entryId) {
		console.warn('No time entry open to enhance')
		return
	}

	let currentNotes = GetOpenEntryNotes()
	if (!currentNotes) {
		console.warn('No notes to enhance')
		return
	}

	ToggleLoader(true)
	try {
		let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_TOKEN}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				systemInstruction: {
					parts: [{ text: `You are a professional technical writer helping improve time-tracking notes for a software development team.
Rewrite the provided time entry notes to be clear, concise, and professional.
Guidelines:
- Use plain, active language (e.g. "Segmented recorded meeting and linked discussions to Jira tickets")
- Preserve all technical detail, ticket references, URLs, and Ref/See lines exactly as-is
- Keep it brief — one or two sentences per distinct task at most
- Do not add information that wasn't implied by the original
- Return only the rewritten notes, no preamble or explanation` }]
				},
				contents: [{ parts: [{ text: currentNotes }] }],
			}),
		})
		if (!response.ok) throw new Error(`Gemini API request failed with status ${response.status}`)

		let data = await response.json()
		let enhanced = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
		if (!enhanced) throw new Error('No text response from Gemini')

		if (window.confirm(`Replace notes with:\n\n${enhanced}`)) {
			await PatchTimeEntry(entryId, { notes: enhanced })
			SetOpenEntryNotes(enhanced)
		}
	} catch (error) {
		console.error('Error enhancing notes:', error.message)
	}

	ToggleLoader(false)
}

// ─── Button click handlers ────────────────────────────────────────────────────

async function OnGitHubClick() {
	try {
		let ref = await PromptForCommit()
		if (ref) await LinkReference(ref)
	} catch (e) {
		console.error(e.message)
		ToggleLoader(false)
	}
}

async function OnLinkClick() {
	let ref = await PromptForLink()
	if (ref) await LinkReference(ref)
}

// ─── Event listeners ──────────────────────────────────────────────────────────

$(document).on('click', '.js-edit-entry, .js-new-time-entry', () => InjectButtons())
$(document).on('click', '.github-time-entry', () => OnGitHubClick())
$(document).on('click', '.harvest-link-entry', () => OnLinkClick())
$(document).on('click', '.harvest-enhance-entry', () => EnhanceNotes())
$(document).on('keydown', async e => {
	let char = String.fromCharCode(e.which).toLowerCase()
	if (!e.altKey && !e.metaKey) return
	e.preventDefault()
	switch (char) {
		case 'g': $('.github-time-entry').trigger('click'); break
		case 'l': $('.harvest-link-entry').trigger('click'); break
		case 'e': $('.harvest-enhance-entry').trigger('click'); break
	}
})
