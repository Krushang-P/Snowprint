// This is a pseudorandom number generator (PRNG) based on the
// minimal standard generator presented in the following paper:
// "Random number generators: good ones are hard to find"
// https://dl.acm.org/doi/pdf/10.1145/63039.63042

let next = 1;

// Return a random Number between <min> and <max>, inclusive,
// such that it is a multiple of <step>
function rand(min, max, step) {
	next = 16807 * next % 2147483647;
	let steps = (max - min) / step + 1;
	return next % steps * step + min;
}

// Seed the PRNG with the integer Number <seed>
function srand(seed) {
	next = seed;
}

export {rand, srand};
