const SCROLL_DISTANCE = 200;
let transcript = {};

function parseTimeString(input) {
  const regex = /(?:(\d+)\s+hours?\s*)?(?:(\d+)\s+minutes?\s*)?(?:(\d+)\s+seconds?)?$/i;
  const match = input.match(regex);

  if (!match)
    return null;
  
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  const userPart = input.replace(regex, "").trim();
  const user = userPart.length > 0 ? userPart : null;

  return { user, hours, minutes, seconds };
}

function buildTranscript(){
	Array.from(document.querySelectorAll('.ms-List-cell [id^="entry-"]')).reduce((acc, curr) => {
	    const {id} = curr;
	    const user = curr.querySelector('span[id^="timestampSpeakerAriaLabel-"]');
	    const text = curr.querySelector('div[class^="entryText-"]');
	    acc[id] = { ...parseTimeString(user?.innerText), text: text?.innerText};
	    return acc;
	},transcript);
}

function scrollElement(ele){
	ele.scrollBy(0,SCROLL_DISTANCE);
}

let evtScroll = null;
function startScroll(){
	transcript = {};
	evtScroll = setInterval(() => {
		buildTranscript();
		let ele = document.querySelector('#scrollToTargetTargetedFocusZone');
		scrollElement(ele);
		if(ele.scrollTop + ele.offsetHeight>= ele.scrollHeight)
			stopScroll();
	},100);
}

function stopScroll(){
	if(evtScroll) {
		clearInterval(evtScroll);
		downloadCSV(Object.values(transcript));
		alert('Transcript available');
	}
}

function escapeCSV(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) 
    return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadCSV(data) {
  const headers = ["User", "Hours", "Minutes", "Seconds", "Text"];
  const rows = data.map(row => headers.map(h => escapeCSV(row[h.toLowerCase()])));
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transcript.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
