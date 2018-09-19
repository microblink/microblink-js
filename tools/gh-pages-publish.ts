const { cd, exec, echo, touch } = require("shelljs")
const { readFileSync } = require("fs")
const url = require("url")

let repoUrl
let pkg = JSON.parse(readFileSync("package.json") as any)
if (typeof pkg.repository === "object") {
  if (!pkg.repository.hasOwnProperty("url")) {
    throw new Error("URL does not exist in repository section")
  }
  repoUrl = pkg.repository.url
} else {
  repoUrl = pkg.repository
}

let parsedUrl = url.parse(repoUrl)

console.log('parsedUrl', parsedUrl);

let repository = (parsedUrl.host || "") + (parsedUrl.path || "")
let deployUrl = repository;

console.log('repository', repository);

let ghToken = process.env.GH_TOKEN


if (ghToken) {
  if (deployUrl.startsWith('git@')) {
    deployUrl = 'https://' + ghToken + '@' + repository.substring(4);
  }
}

console.log('ghToken', ghToken);

console.log('deployUrl', deployUrl);

echo("Deploying docs!!!")
cd("docs")
touch(".nojekyll")
exec("git init")
exec("git add .")
exec('git config user.name "Matija Stepanic"')
exec('git config user.email "matija.stepanic@microblink.com"')
exec('git commit -m "docs(docs): update gh-pages"')
exec(
  `git push --force --quiet "${deployUrl}" master:gh-pages`
)
echo("Docs deployed!!")
