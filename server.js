const express = require('express');
const cors = require('cors');
const app = express();
const iconv = require('iconv-lite');
const PORT = 5000;

app.use(cors());
app.use(express.json());

// UTIL START

const findIndicesWithSum = (arr, targetSum) => {
    const results = [];

    const backtrack = (startIndex, currentSum, currentIndices) => {
        if (currentSum === targetSum) {
            results.push([...currentIndices]);
            return;
        }

        if (currentSum > targetSum) return;

        for (let i = startIndex; i < arr.length; i++) {
            currentIndices.push(i);
            backtrack(i + 1, currentSum + arr[i], currentIndices);
            currentIndices.pop();
        }
    }

    backtrack(0, 0, []);
    return results;
}

const randomStep = (start, end) => {
    return Math.floor(Math.random() * (end - start + 1)) + start;
}

const gcd = (a, b) => {
    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }

    return a;
}

// const findCoprime = (n) => {
//     if (n === 1) return 2;
    
//     for (let i = 2; i <= n + 1; i++) {
//         if (gcd(n, i) === 1) {
//             return i;
//         }
//     }
    
//     return n + 1; 
// }

const findCoprime = (n) => {
    const candidates = [];

    for (let i = 2; i < n; i++) {
        if (gcd(n, i) === 1) {
            candidates.push(i);
        }
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
};

// UTIL END

// API START

app.post('/api/encode', (req, res) => {
    console.log('\n-----Encode Call-----\n');
    const { message, e } = req.body;
    console.log(`Props - message: ${message}, public key: ${e}`);
    const c = new Array(message.length).fill(0);

    const buffer = iconv.encode(message, 'win1251');
    const binaryArray = Array.from(buffer)
        .map(byte => byte.toString(2).padStart(8, '0'));

    console.log(`Binary Message: ${binaryArray}`);

    for (let i = 0; i < binaryArray.length; i++) {
        const binaryStr = binaryArray[i].toString(2).padStart(8, '0');

        console.log(`Binary String: ${binaryStr}`);

        for (let j = 0; j < e.length; j++) {
            if (binaryStr[j] === '1') {
                console.log(`c[${i}] = c[${i}] + e[${j}]: ${c[i]} = ${c[i]} + ${e[j]}`);
                c[i] = c[i] + e[j];
            }
        }
    }

    console.log(`Final Sequence: `, c);

    res.json({ result: c, textToBinary: binaryArray });
});

// Here
app.post('/api/decode', (req, res) => {
    console.log('\n-----Decode Call-----\n');
    const { message, d, m, n1 } = req.body;
    console.log(`Props - message: ${m}, private key: ${d}, m: ${m}, n1: ${n1}`);
    const binaryArray = [];

    console.log(`Decode: ${message}, ${d}, ${m}, ${n1}`);

    for (let i = 0; i < message.length; i++) {
        const sum = (Number(message[i]) * Number(n1)) % Number(m);
        console.log(`Sum: ${sum}`);
        const tempBites = [0, 0, 0, 0, 0, 0, 0, 0];

        const positions = findIndicesWithSum(d, sum); 

        positions.map(position => {
            console.log(`Position: `, position);
            position.map(index => tempBites[index] = 1);
        });

        binaryArray.push(tempBites.join(''));
    }

    console.log(binaryArray);

    const bytes = binaryArray.map(binStr => parseInt(binStr, 2));
    const buffer = Buffer.from(bytes);
    const decodedMessage = iconv.decode(buffer, 'win1251');

    res.json({ result: decodedMessage });
});

app.post('/api/key/private', (req, res) => {
    console.log('\n-----Private Key Call-----\n');
    let { start, length, stepStart, stepEnd } = req.body;
    const sequence = [];

    console.log(`Props - start: ${start}, length: ${length}, stepStart: ${stepStart}, stepEnd: ${stepEnd}`);

    sequence.push(start);
    console.log(`Sequence[${0}]: ${sequence[0]}`);

    for (let i = 1; i < length; i++) {
        const rand = randomStep(stepStart, stepEnd);
        const prevSum = sequence.reduce((acc, cur) => acc + cur)
        sequence[i] = rand + prevSum;
        console.log(`Sequence[${i}]: randStep: ${rand} + prevSum: ${prevSum} = ${sequence[i]}`);
    }

    console.log('Final sequence', sequence);

    res.json({ result: sequence });
});

app.post('/api/key/public', (req, res) => {
    console.log('\n-----Public Key Call-----\n');
    console.log('Formula: (d[i] * n) mod m');
    const { d, m, n } = req.body;
    const e = [];

    console.log(`Props - d: ${d}, m: ${m}, n: ${n}`);

    for (let i = 0; i < d.length; i++) {
        const buf = d[i] * n % m; 
        console.log(`e: d * n mod m = ${d[i]} * ${n} mod ${m} = ${buf}`);
        e.push(buf);
    }

    console.log('Final sequence:', e);

    res.json({ result: e });
});

app.post('/api/props/n', (req, res) => {
    const { m } = req.body;
    const n = findCoprime(m);

    console.log(`Get N: ${n} with m: ${m}`);

    res.json({ result: n });
});

app.post('/api/props/n-1', (req, res) => {
    const { n, m } = req.body;
});

app.listen(PORT, () => {
    console.log(`Express-сервер на http://localhost:${PORT}`);
});