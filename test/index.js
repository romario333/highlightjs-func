import path from 'path'
import { readdir, readFile } from 'node:fs/promises'

import 'should'
import hljs from 'highlight.js'

import hljsDefineLanguages from '../src/index.js'

hljsDefineLanguages(hljs)  // install all our languages
const markupTests = path.join(path.resolve(), 'test', 'markup')

async function compareWithExpected (language, filePath) {
  const expectFilePath = filePath.replace('.txt', '.expect.txt')
  const code = await readFile(filePath, 'utf-8')
  const expected = await readFile(expectFilePath, 'utf-8')

  const result = hljs.highlight(code, { language })

  result.value.trim().should.eql(expected.trim())
}

async function runAutodetect (language, filePath) {
  const code = await readFile(filePath, 'utf-8')

  const actual = hljs.highlightAuto(code).language

  actual.should.eql(language)
}

describe('FunC syntax highlighting', () => {
  let languages = []

  before(async () => {
    languages = (await readdir(markupTests, { withFileTypes: true }))
      .filter((obj) => obj.isDirectory())
      .map((dir) => dir.name)

    for (const language of languages) {
      const scenarios = (await readdir(path.join(markupTests, language)))
        .filter((file) => !file.includes('.expect.'))
        .map((file) => file.replace(/\.txt$/, ''))

      describe(`Generated markup tests for ${language}`, async () => {
        scenarios.forEach((scenario) => {
          const filePath = path.join(markupTests, language, `${scenario}.txt`)

          it(`should perform syntax highlighting on ${scenario}`, async () => {
            await compareWithExpected(language, filePath)
          })

          it(`should detect syntax on ${scenario}`, async () => {
            await runAutodetect(language, filePath)
          })
        })
      })
    }
  })

  it('Ensure tests are generated', () => {
    languages.length.should.be.above(0)
  })
})
