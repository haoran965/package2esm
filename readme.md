# package2esm

Convert packages in node_modules to ESM, suitable for packages that do not have ESM support but require the use of ESM.

## Usage1


```bash
# install
npm install package2esm -g

# use1
p2esm [xxx] 
# such as p2esm @netless/slide

# copy node_modules and convert to esm, and write to the specified directory, default is ./esm
p2esm -ac
```
When used as a global npm package, it usually implies that the project is for personal use. Installation of `package2esm` is required only if specified in the project's readme document.

## Usage2
and you can use it in your project
```bash
npm install package2esm -D
```

and update your package.json scripts such as
```json
{
  "scripts": {
    "dev": "node src/index.js"
  }
}
```
to
```json
{
  "scripts": {
    "dev": "p2esm @netless/slide && node src/index.js"
  }
}
```

## Contribute
Welcome to contribute, I am coding best, welcome to judge