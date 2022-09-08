
import sql from 'mssql'
import config from '../connection.json'
import express from 'express'
import { createPurpose, getAllPurposes } from "../core/core"
import { buildBoxBySingleId, buildDependencies, concludeTask, createRelashionship, deletePurpose, editPurpose, getNextPurposes, PurposeParameters, selectBox } from '../core/core'
const fs = require('fs')

const sql_init_queries = fs.readFileSync('./src/database/init_table.sql', 'utf-8')

// configuração do servidor
const app = express()
app.use(express.json())
const port = 3000

sql.connect(config).then(async connection => {
  console.log("Servidor conectado!")
  const request = connection.request()
  request.query(sql_init_queries)

  app.get('/all', async (req, resp) => {
    const response = await getAllPurposes(request)
    resp.json(response)
  })

  app.put('/build_purpose', async (req, res) => {
    const result = req.body
    console.log({ result })
    const response = await createPurpose({
      title: result.title, description: result.description,
      status: Number(result.status)
    }, request)

    res.json(response).status(200).send()
  })

  app.put('/insert_relashionship', async (req, res) => {
    const body = req.body
    console.log({ body })
    await createRelashionship(req.body.master_id, req.body.parent_ids, req.body.children_ids, request)
    res.json(await getAllPurposes(request))
  })

  app.delete('/delete_purpose', async (req, res) => {
    res.json(await deletePurpose(req.body.purpose_id, request))
  })

  app.post('/edit_purpose', async (req, res) => {
    const body = req.body
    console.log({ body })
    res.json(await editPurpose({ title: body.content.title, description: body.content.description }, body.purpose_id, request))

  })

  app.post('/build_box', async (req, res) => {
    const body = req.body
    console.log({ body })
    const response = await buildBoxBySingleId(body.before, body.after, request)
    console.log("Retorno")
    console.log({ response })
    res.json(response)
  })

  app.post('/make_dependencies', async (req, res) => {
    const body = req.body
    res.json(await buildDependencies(body.content.from, body.content.to, request))
  })

  app.post('/select_box', async (req, res) => {
    const body = req.body
    res.json(await selectBox(body.content.boxId, request))
  })

  app.post('/conclude_task', async (req, res) => {
    const body = req.body
    res.json(await concludeTask(body.content.purposeId, request))
  })

  app.post('/get_next_purpose', async (req, res) => {
    const body = req.body
    res.json(await getNextPurposes(body.content.purposeId, request))
  })

  app.listen(port)
})