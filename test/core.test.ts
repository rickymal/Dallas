import { ConnectionPool } from "mssql"
import { createRelashionship } from "../core/core"
import { getAllPurposes } from "../core/core"
import { deletePurpose } from "../core/core"
import { editPurpose } from "../core/core"
import { buildBoxBySingleId } from "../core/core"
import { buildDependencies } from "../core/core"
import { selectBox } from "../core/core"
import { concludeTask } from "../core/core"
import { getNextPurposes } from "../core/core"
import { createPurpose } from "../core/core"

const fs = require('fs')
const mssql: ConnectionPool = require('mssql')
const config = require('../connection.json')
const sql_init_queries = fs.readFileSync('./src/database/init_table.sql', 'utf-8')
let mssql_connection;
let request;

beforeAll(async () => {
  mssql_connection = await mssql.connect(config)
  request = await mssql_connection.request()
})

afterAll(() => {
  mssql.close()
})

let users = []

// Isso não deveria fazer parte do teste! retirar depois
describe("Construção de contas e configuração geral do banco", () => {
  it("Limpeza geral das tabelas", async () => {
    await request.query(sql_init_queries)
  })
})


describe("Construção dos propósitos", () => {

  it("Capaz de criar o propósito 'slowio'", async () => {
    const expected = {
      title: "Slowio",
      description: "Projeto slowio",
      done: false,
      id: 1,
    }

    const parameters = {
      title: "Slowio",
      description: "Projeto slowio",
      status: 0
    }

    const result = await createPurpose(parameters, request)
    expect(result).toStrictEqual(expected)
  })

  it("Construção do subpropósitos 'dataops','marketing' para 'slowio'", async () => {

    let parameters = {
      title: "DataOps",
      description: "Propósito para trabalhar com DataOps",
      status: 0,
    }
    let result_first = await createPurpose(parameters, request)

    parameters = {
      title: "Marketing",
      description: "Propósito para trabalhar com Marketing",
      status: 0,
    }
    let result_second = await createPurpose(parameters, request)

    await createRelashionship(result_first.id, [1], [], request)
    await createRelashionship(result_second.id, [1], [], request)

    const allPurposes = await getAllPurposes(request)
    expect(allPurposes).toStrictEqual(
      [{ "Descrição da tarefa principal": "Projeto slowio", "Descrição da tarefa secundária": "Propósito para trabalhar com DataOps", "Id do título principal": 1, "Id do título secundário": 2, "Status": false, "Título da tarefa secundária": "DataOps", "Título principal": "Slowio" }, { "Descrição da tarefa principal": "Projeto slowio", "Descrição da tarefa secundária": "Propósito para trabalhar com Marketing", "Id do título principal": 1, "Id do título secundário": 3, "Status": false, "Título da tarefa secundária": "Marketing", "Título principal": "Slowio" }]
    )
  })
})

describe("Manipulação dos propósitos", () => {
  it("Deve ser capaz de criar quatro subpropósitos para o DataOps", async () => {
    let parameters = {
      title: "Subtarefa do DataOps",
      description: "Tarefa 1",
      status: 0,
    }

    let result_first = await createPurpose(parameters, request)
    parameters = {
      title: "Subtarefa do DataOps",
      description: "Tarefa 2",
      status: 0,
    }
    let result_third = await createPurpose(parameters, request)

    parameters = {
      title: "Subtarefa do DataOps",
      description: "Tarefa 3",
      status: 0,
    }

    let result_fourth = await createPurpose(parameters, request)

    parameters = {
      title: "Subtarefa do DataOps",
      description: "Tarefa 4",
      status: 0,
    }

    let result_second = await createPurpose(parameters, request)

    await createRelashionship(result_first.id, [2], [], request)
    await createRelashionship(result_second.id, [2], [], request)
    await createRelashionship(result_third.id, [2], [], request)
    await createRelashionship(result_fourth.id, [2], [], request)
  })

  it("Apagar dois subpropósitos criados", async () => {
    const response = await Promise.all([deletePurpose(6, request), deletePurpose(7, request)])
    expect(response).toStrictEqual(
      [{ "output": {}, "recordset": undefined, "recordsets": [], "rowsAffected": [1, 1] }, { "output": {}, "recordset": undefined, "recordsets": [], "rowsAffected": [1, 1] }]
    )
  })

  it("Editar um dos propósitso (marketing)", async () => {
    const fields = {
      title: "Um título mockado",
      description: "Uma descrição modificada de marketing"
    }

    const purpose_id = 3
    const response = await editPurpose(fields, purpose_id, request)

    expect(response).toEqual({
      "output": {},
      "recordset": undefined,
      "recordsets": [],
      "rowsAffected": [
        1,
      ],
    })
  })

  it("Criar mais quatro subpropósitos para o DataOps", async () => {

    let parameters;
    let options;

    parameters = {
      title: "Subtarefa do DataOps",
      description: "Tarefa 5",
      status: 0,
    }

    let result_first = await createPurpose(parameters, request)

    parameters = {
      title: "Subtarefa do DataOps",
      description: "Tarefa 6",
      status: 0,
    }

    let result_second = await createPurpose(parameters, request)

    parameters = {
      title: "Subtarefa do DataOps",
      description: "Tarefa 7",
      status: 0,
    }
    let result_third = await createPurpose(parameters, request)

    parameters = {
      title: "Subtarefa do DataOps",
      description: "Tarefa 8",
      status: 0,
    }

    let result_fourth = await createPurpose(parameters, request)
    await createRelashionship(result_first.id, [2], [], request)
    await createRelashionship(result_second.id, [2], [], request)
    await createRelashionship(result_third.id, [2], [], request)
    await createRelashionship(result_fourth.id, [2], [], request)
  })

})

describe("Comportamento dos propósitos em caixas de tarefas", () => {
  it("Deve ser capaz de criar uma caixa de tarefas com quatro tarefas já definidas (duas antes e duas depois)", async () => {
    let query: Array<string> = []
    query.push("begin transaction")
    const response = await buildBoxBySingleId([4, 5], [8, 9], request)
    expect(response).toStrictEqual({
      "output": {},
      "recordset": [
        {
          "description": "Tarefa 1",
          "done": false,
          "id": 4,
          "title": "Subtarefa do DataOps",
        },
        {
          "description": "Tarefa 2",
          "done": false,
          "id": 5,
          "title": "Subtarefa do DataOps",
        },
      ],
      "recordsets": [
        [
          {
            "description": "Tarefa 1",
            "done": false,
            "id": 4,
            "title": "Subtarefa do DataOps",
          },
          {
            "description": "Tarefa 2",
            "done": false,
            "id": 5,
            "title": "Subtarefa do DataOps",
          },
        ],
        [
          {
            "description": "Tarefa 5",
            "done": false,
            "id": 8,
            "title": "Subtarefa do DataOps",
          },
          {
            "description": "Tarefa 6",
            "done": false,
            "id": 9,
            "title": "Subtarefa do DataOps",
          },
        ],
        [
          {
            "id": 1
          }
        ]
      ],
      "rowsAffected": [
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        2,
        2,
        1,
      ],
    })
  })

  it("Capaz de definir as dependencias na caixa de tarefas", async () => {

    // A tarefa 4 depende da tarefa 5
    const r1 = await buildDependencies([4], [5], request)
    const r2 = await buildDependencies([8], [9], request)

    expect([r1, r2]).toStrictEqual([
      {
        "output": {},
        "recordset": [
          {
            "from_purpose": 4,
          },
        ],
        "recordsets": [
          [
            {
              "from_purpose": 4,
            },
          ],
        ],
        "rowsAffected": [
          1,
          1,
        ],
      },
      {
        "output": {},
        "recordset": [
          {
            "from_purpose": 4,
          },
          {
            "from_purpose": 8,
          },
        ],
        "recordsets": [
          [
            {
              "from_purpose": 4,
            },
            {
              "from_purpose": 8,
            },
          ],
        ],
        "rowsAffected": [
          1,
          2,
        ],
      },
    ]
    )
  })

  it("Selecionar a caixa de tarefas trazendo as tarefas que podem ser feitas", async () => {
    const response = await selectBox(1, request) //seleciona a única caixa de tarefas
    expect(response).toStrictEqual({
      "output": {},
      "recordset": [
        {
          "description": "Tarefa 1",
          "done": false,
          "id": 4,
          "title": "Subtarefa do DataOps",
        },
        {
          "description": "Tarefa 2",
          "done": false,
          "id": 5,
          "title": "Subtarefa do DataOps",
        },
      ],
      "recordsets": [
        [
          {
            "description": "Tarefa 1",
            "done": false,
            "id": 4,
            "title": "Subtarefa do DataOps",
          },
          {
            "description": "Tarefa 2",
            "done": false,
            "id": 5,
            "title": "Subtarefa do DataOps",
          },
        ],
        [
          {
            "description": "Tarefa 5",
            "done": false,
            "id": 8,
            "title": "Subtarefa do DataOps",
          },
          {
            "description": "Tarefa 6",
            "done": false,
            "id": 9,
            "title": "Subtarefa do DataOps",
          },
        ],
      ],
      "rowsAffected": [
        2,
        2,
      ],
    })
  })

  it("Capaz de marcar uma tarefa como concluida e recebe a próxima tarefa da dependencia", async () => {
    const taskId = 8
    await concludeTask(taskId, request)
    const q1 = `select done from purpose where id = ${taskId}`
    const resp2 = await request.query(q1)
    const resp3 = await getNextPurposes(taskId, request)
    expect(resp2).toStrictEqual(
      {
        "output": {},
        "recordset": [
          {
            "done": true,
          },
        ],
        "recordsets": [
          [
            {
              "done": true,
            },
          ],
        ],
        "rowsAffected": [
          1,
        ],
      }
    )
    expect(resp3).toStrictEqual(
      {
        "output": {},
        "recordset": [
          {
            "description": "Tarefa 6",
            "done": false,
            "id": 9,
            "title": "Subtarefa do DataOps",
          },
        ],
        "recordsets": [
          [
            {
              "description": "Tarefa 6",
              "done": false,
              "id": 9,
              "title": "Subtarefa do DataOps",
            },
          ],
        ],
        "rowsAffected": [
          1
        ],
      }
    )
  })
})