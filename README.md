# Quantum Wordle

This is a Quantum twist on the popular word guessing game we all know and love.

Made using React, Typescript, and Tailwind. Original code based on https://github.com/cwackerfuss/react-wordle

[**Demo: Quantum Wordle**](https://bhat.ca/projects/quantum-wordle)

## Build and run

### To Run Locally:

Clone the repository and perform the following command line actions:

```bash
$> cd quantum-wordle
$> npm install
$> npm run start
```

### To build/run docker container:

#### Development

```bash
$> docker build -t game:dev .
$> docker run -d -p 3000:3000 game:dev
```

Open [http://localhost:3000](http://localhost:3000) in browser.

#### Production

```bash
$> docker build --target=prod -t game:prod .
$> docker run -d -p 80:80 game:prod
```
