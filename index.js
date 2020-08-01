let app = require('express')()
let redis = require('redis').createClient(process.env.REDIS_URL)
let fetch = require('node-fetch')
let PORT = process.env.PORT || 3000

async function fetchTargetAccount(acct) {
  let [account, domain] = acct.split('@')
  let response = await fetch(`https://${domain}/.well-known/webfinger?resource=acct:${acct}`)
  if (response.ok) {
    return await response.json()
  } else {
    throw 404
  }
}

app.get('/.well-known/webfinger', (req, res) => {
  let host = req.headers.host
  let resource = req.query.resource
  let match = resource.match(/acct:(.+?)@/)
  if (match) {
    let id = match[1]
    fetch(`https://raw.githubusercontent.com/${id}/acct.im/master/target`).then(response => {
      if (response.ok) {
        response.text().then(body => {
          fetchTargetAccount(body.replace(/\s/g, '')).then(json => {
            let ret = Object.assign({}, json, {subject: resource})
            res.send(ret)
          })
        })
      } else {
        res.status(response.status).send(response.statusText)
      }
    })
  } else {
    res.status(404).send('Unrecognized resource')
  }

})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
