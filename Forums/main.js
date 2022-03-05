//NavBar
function hideIconBar(){
    var iconBar = document.getElementById("iconBar");
    var navigation = document.getElementById("navigation");
    iconBar.setAttribute("style", "display:none;");
    navigation.classList.remove("hide");
}

function showIconBar(){
    var iconBar = document.getElementById("iconBar");
    var navigation = document.getElementById("navigation");
    iconBar.setAttribute("style", "display:block;");
    navigation.classList.add("hide");
}

//Comment
function showComment(){
    var commentArea = document.getElementById("comment-area");
    commentArea.classList.remove("hide");
}

//Reply
function showReply(){
    var replyArea = document.getElementById("reply-area");
    replyArea.classList.remove("hide");
}

/////////////////////////////////////////////////////////
// Y'ALL CAN EDIT THESE VARS

const TYPE_DELAY = 70;
const SEARCH_TERMS = [
	"Lady gaga was seen with...",
	"How to embrace the inner queer",
    "If god really hated gays, why are they so cute?"
];

/////////////////////////////////////////////////////////
// Throttling function for animation queue

function throttle(fn, limit) {
	let prm = Promise.resolve();
	return function (...args) {
		if (args[0].wait) {
			prm = prm
				.then(() => {
					document.getElementById('search').classList.add('active');
				 return new Promise((r) => setTimeout(r, args[0].wait))
				})
				.then(() => {
						document.getElementById('search').classList.remove('active');
						return Promise.resolve(args[0].cb());
			});
			return;
		}

		prm = prm.then(
			() =>
				new Promise((r) => {
					fn.apply(null, args);
					setTimeout(r, limit);
				})
		);
	};
}
/////////////////////////////////////////////////////////
// Blinking cursor initialization

let tickTimeout;

function tick() {
	tickTimeout = setTimeout(() => {
		const b = document.getElementById("before");
		b.classList.toggle("cursor");
		tick();
	}, 500);
}

tick();

/////////////////////////////////////////////////////////
// Levenshtein implementation

function getMemo(str1, str2) {
	const memo = [];

	for (let i = 0; i <= str1.length; i++) {
		memo.push([]);
		for (let j = 0; j <= str2.length; j++) {
			if (!i || !j) {
				memo[i][j] = i || j;
				continue;
			}
			memo[i][j] = Math.min(
				memo[i - 1][j] + 1,
				memo[i][j - 1] + 1,
				memo[i - 1][j - 1] + (str1[i - 1] === str2[j - 1] ? 0 : 2)
			);
		}
	}
	return memo;
}

function translatePath({ moves, str1, str2 }) {
	const ops = [];
	for (let i = 0; i < moves.length - 1; i++) {
		const prev = moves[i];
		const curr = moves[i + 1];

		if (prev[1] - curr[1] === 1 && prev[0] - curr[0] === 1) {
			if (str1[curr[0]] === str2[curr[1]]) {
				ops.push({
					type: "match",
					char: null,
					index: curr[1]
				});
			} else {
				ops.push({
					type: "replace",
					char: str1[curr[0]],
					index: curr[1]
				});
			}
			continue;
		}

		if (prev[1] - curr[1] === 1) {
			ops.push({
				type: "delete",
				char: null,
				index: curr[1]
			});
			continue;
		}

		if (prev[0] - curr[0] === 1) {
			ops.push({
				type: "insert",
				char: str1[curr[0]],
				index: curr[1]
			});
			continue;
		}
	}

	return ops;
}

function getPath(memo) {
	let i = memo.length - 1;
	let j = memo[0].length - 1;

	let dir = "row";
	const moves = [[i, j]];
	while (i > 0 || j > 0) {
		let b = null;
		const options = (dir === "row"
			? [
					[i - 1, j],
					[i, j - 1],
					[i - 1, j - 1]
			  ]
			: [
					[i, j - 1],
					[i - 1, j],
					[i - 1, j - 1]
			  ]
		).filter((a) => a[0] >= 0 && a[1] >= 0);

		for (let i = 0; i < options.length; i++) {
			const o = options[i];
			if (!b || memo[o[0]][o[1]] < memo[b[0]][b[1]]) {
				b = o;
				continue;
			}
			if (o[0] < 0 || o[1] < 0) break;
		}
		moves.push(b);
		i = b[0];
		j = b[1];
	}
	return moves;
}

function edit({ desired: str1, actual: str2 }) {
	// str1: desired string.
	// str2: actual string.
	const memo = getMemo(str1, str2);
	const moves = getPath(memo);
	const t = translatePath({ moves, str1, str2 });
	return t;
}
/////////////////////////////////////////////////////////
// DOM animation implementation

function lockCursorOn() {
	clearTimeout(tickTimeout);
	tickTimeout = setTimeout(tick, 0);
	document.getElementById("before").classList.add("cursor");
}

const execute = throttle(function (cmd) {
		const before = document.getElementById("before");
		const after = document.getElementById("after");
	
		lockCursorOn();

		if (cmd.type === "move-left") {
			const btext = before.innerHTML;
			before.innerHTML = btext.slice(0, -1);
			after.innerHTML = btext[btext.length - 1] + after.innerHTML;
			return;
		}

		if (cmd.type === "move-right") {
			const atext = after.innerHTML;
			before.innerHTML += atext[0];
			after.innerHTML = atext.slice(1);
			return;
		}

		if (cmd.type === "delete-before") {
			before.innerHTML = before.innerHTML.slice(0, -1);
			return;
		}

		if (cmd.type === "insert-before") {
			before.innerHTML = before.innerHTML + cmd.char;
			return;
		}

		if (cmd.type === "insert-after") {
			after.innerHTML = cmd.char + after.innerHTML;
			return;
		}
	}, TYPE_DELAY);


function animateEdit(words) {
	const before = document.getElementById("before");
	const after = document.getElementById("after");
	before.innerHTML = words[0];
	execute({
		wait: 2000,
		cb: () => editOne(0)
	})

	function editOne(idx) {
		console.log(idx)
		let turing = [];

		const route = edit({
			actual: words[idx],
			desired: words[(idx+1)%words.length]
		});
		let moveNum = 0;
		let inserts = [];
		let deleteCount = 0;
		let i = 0;

		let cursor = before.innerHTML.length;
		console.log(before.innerHTML);
		while (cursor++ < words[idx].length) {
			turing.push({ type: "move-right" });
		}

		while (i < route.length) {
			const cmd = route[i];

			if (cmd.type === "match") {
				if (turing[turing.length - 1].type === "move-right") {
					turing.pop();
				} else {
					turing.push({ type: "move-left" });
				}

				i++;
				continue;
			} else if (
				cmd.type === "replace" ||
				cmd.type === "insert" ||
				cmd.type === "delete"
			) {
				while (
					route[i] &&
					(route[i].type === "replace" ||
						route[i].type === "insert" ||
						route[i].type === "delete")
				) {
					if (route[i].type === "delete") {
						deleteCount++;
						i++;
						continue;
					}

					if (route[i].type === "replace") deleteCount++;

					inserts.unshift({
						type: "insert-before",
						char: route[i].char
					});
					i++;
				}

				for (let i = 0; i < deleteCount; i++)
					turing.push({ type: "delete-before" }); //add a delete command for every replace entry we hit.

				for (let i = 0; i < inserts.length; i++) turing.push(inserts[i]);
				//add all of the inserts we've been saving;

				for (let i = 0; i < inserts.length; i++) turing.push({ type: "move-left" });
				//do as many left moves as it takes to get cursor back to the right location.

				//reset my counters
				inserts = [];
				deleteCount = 0;
				continue;
			}
		}

		while (turing[turing.length - 1].type === "move-left") {
			turing.pop();
		}
		
		turing.push({
				wait: 2000,
				cb: () => editOne((idx + 1) % words.length)
		});

		turing.forEach(execute);
	}
}

animateEdit(SEARCH_TERMS);
