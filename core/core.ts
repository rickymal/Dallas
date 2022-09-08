
const fs = require('fs')

export async function getNextPurposes(taskId: number, request) {
    const q2 = `select * from purpose where id = (select to_purpose from purpose_dependencies where from_purpose = ${taskId})`
    const resp3 = await request.query(q2)
    return resp3
}

type MssqlResponse = {
    output: Array<any>
    recordset: any
    recordsets: Array<any>
    rowsAffected: Array<number>
}[]

export async function deletePurpose(purpose_id, request) : Promise<MssqlResponse> {
    var query = `delete from purpose where id = ${purpose_id}
    delete from purpose_relashionship where auditory_purpose = ${purpose_id} or audited_purpose = ${purpose_id}
    `

    // O correto é trabalhar com 'cascade', mas como eu estou o tempo todo remodelando, fazer assim por hora
    return request.query(query).then((resp: { recordset: Array<Object> }) => {
        return resp
    })
}

export async function concludeTask(purpose_id, request) {
    const q0 = `update purpose set purpose.done = 1 where id = ${purpose_id}`
    return await request.query(q0)        
}

// Método responsável por editar os propósitos, recebendo o 'id' do propósito que se deseja apagar
export function editPurpose(fields: { title: string; description: string }, purpose_id: number, request) {
    var subquery = Object.entries(fields).map(([key, val]) => {
        return `${key} = '${val}'`
    }).join(',')

    var query = `update purpose set ${subquery} from purpose where purpose.id = ${purpose_id}`
    const response = request.query(query)
    return response
}

type PurposesRelations = {
    "Descrição da tarefa principal": string
    "Descrição da tarefa secundária": string
    "Id do título principal": number
    "Id do título secundário": number
    "Status": boolean
    "Título da tarefa secundária": string
    "Título principal": string
}[]

export async function getAllPurposes(request) : Promise<PurposesRelations>{
    var query = `
    select 
        p1.id as 'Id do título principal',
        p1.title as 'Título principal',
        p1.description as 'Descrição da tarefa principal',
        p2.id as 'Id do título secundário',
        p2.title as 'Título da tarefa secundária',
        p2.description as 'Descrição da tarefa secundária',
        p2.done as 'Status'
    from purpose_relashionship 
        join purpose p1 on purpose_relashionship.auditory_purpose = p1.id
        join purpose p2 on purpose_relashionship.audited_purpose = p2.id  
    `
    return (await request.query(query)).recordset
}

type Purpose = {
    title: string
    description: string
    done: boolean
    id: number
}

export type PurposeParameters = {
    title: string
    description: string
    status: number
}

// Método responsável por criar os propósitos, recebendo o 'id' do propósito que se deseja apagar
export async function createPurpose(parameters: PurposeParameters, request: any): Promise<Purpose> {
    var query = `
    begin transaction
        insert into purpose values(
            '${parameters.title}',
            '${parameters.description}',
            ${parameters.status}
        )
        select * from purpose where id = SCOPE_IDENTITY()
        commit`

    let result;
    result = await request.query(query)
    return result.recordset[0]
}

// Método responsável por criar os relacionamentos 
export async function createRelashionship(purpose_ref_id: number, from: Array<number>, to: Array<number>, request) {
    var queryBuilder: Array<string> = new Array<string>()
    
    queryBuilder.push("begin transaction")
    from.forEach(purpose_id => {
        queryBuilder.push(`insert into purpose_relashionship values(${purpose_id}, ${purpose_ref_id})`)
    })
 
    to.forEach(purpose_id => {
        queryBuilder.push(`insert into purpose_relashionship values(${purpose_ref_id}, ${purpose_id})`)
    })
    
    queryBuilder.push('commit')
    console.log({message: queryBuilder})
    const result = await request.query(queryBuilder.join("\n"))
    return result.recordset
}

type Task = {
    title: string
    description: string
}

// Método que criar uma daily a partir de novos dadso 
export async function buildBoxBySinglePurpose(queryBuilder: string[], did_tasks: Task[], gonna_tasks: Task[], purpose_id: number, request: any) {
    queryBuilder.push("begin transaction")
    queryBuilder.push("declare @tk_1 int")
    queryBuilder.push("declare @tk_2 int")

    did_tasks.forEach((_, idx) => {
        queryBuilder.push(`declare @dt_${idx} int`)
    })

    gonna_tasks.forEach((_, idx) => {
        queryBuilder.push(`declare @gt_${idx} int`)
    })

    queryBuilder.push("insert into task_group values(GETDATE())")
    queryBuilder.push("set @tk_1 = SCOPE_IDENTITY()")
    queryBuilder.push("insert into task_group values(GETDATE())")
    queryBuilder.push("set @tk_2 = SCOPE_IDENTITY()")

    did_tasks.forEach((cnt, idx) => {
        queryBuilder.push(`
                insert into purpose values('${cnt.title}','${cnt.description}',0,@tk_1,null)
                set @dt_${idx} = SCOPE_IDENTITY()
            `)
    })

    gonna_tasks.forEach((cnt, idx) => {
        queryBuilder.push(`
                insert into purpose values('${cnt.title}','${cnt.description}',0,@tk_2,null)
                set @gt_${idx} = SCOPE_IDENTITY()
            `)
    })

    did_tasks.forEach((cnt, idx) => {
        queryBuilder.push(`
                insert into purpose_relashionship values(${purpose_id}, @dt_${idx})
            `)
    })

    gonna_tasks.forEach((cnt, idx) => {
        queryBuilder.push(`
                insert into purpose_relashionship values(${purpose_id}, @gt_${idx})
            `)
    })

    queryBuilder.push('commit')
    fs.writeFile('./src/database/wrt_table.sql', queryBuilder.join("\n"), 'utf-8', (err, data) => {
    })
    return await request.query(queryBuilder.join("\n"))
}

export async function buildDependencies(from : Array<number>,to : Array<number>, request) {
    
    let queryBuilder : Array<string> = []
    queryBuilder.push("begin transaction")

    if (!from) {
        throw Error("Esperado que 'from' recebesse Objeto, mas recebido " + typeof(from))
    }

    if (!to) {
        throw Error("Esperado que 'to' recebesse Objeto, mas recebido " + typeof(to))
    }

    from.forEach(async (fr) => {
        to.forEach(async (t) => {
            queryBuilder.push(`insert into purpose_dependencies values(${fr},${t})`)
        })
    })

    queryBuilder.push("select from_purpose from purpose_dependencies")
    queryBuilder.push("commit")
    
    return await request.query(queryBuilder.join("\n"))
}

// Método que criar uma daily a partir de novos dadso 
export async function buildBoxBySingleId(did_tasks: number[], gonna_tasks: number[], request: any) {
    let queryBuilder : Array<string> = []
    queryBuilder.push("begin transaction")
    queryBuilder.push("declare @tk_1 int")
    queryBuilder.push("declare @dd int")
    queryBuilder.push("declare @gt int")
    queryBuilder.push("insert into boxed_tasks values(GETDATE())")
    queryBuilder.push("set @tk_1 = SCOPE_IDENTITY()")
    queryBuilder.push("insert into did_task values(GETDATE(), @tk_1)")
    queryBuilder.push("set @dd = SCOPE_IDENTITY()")
    queryBuilder.push("insert into gonna_task values(GETDATE(), @tk_1)")
    queryBuilder.push("set @gt = SCOPE_IDENTITY()")
    queryBuilder.push("insert into did_purpose_task values(@dd,4)")
    queryBuilder.push("insert into did_purpose_task values(@dd,5)")
    queryBuilder.push("insert into gonna_purpose_task values(@gt,8)")
    queryBuilder.push("insert into gonna_purpose_task values(@gt,9)")
    queryBuilder.push("select * from purpose where id in (select purpose_id from did_purpose_task where did_task_id = (select id from did_task where boxed_task_id = @tk_1))")
    queryBuilder.push("select * from purpose where id in (select purpose_id from gonna_purpose_task where gonna_task_id = (select id from gonna_task where boxed_task_id = @tk_1))")
    queryBuilder.push('select id from boxed_tasks where id = @tk_1')
    queryBuilder.push('commit')
    fs.writeFile('./src/database/wrt_table.sql', queryBuilder.join("\n"), 'utf-8', (err, data) => {
    })
    const main_response = await request.query(queryBuilder.join("\n"))
    return main_response
}

// Método que criar uma daily a partir de novos dadso 
export async function selectBox(boxId : number, request: any) {
    let queryBuilder : Array<string> = []
    queryBuilder.push("begin transaction")
    queryBuilder.push(`select * from purpose where id in (select purpose_id from did_purpose_task where did_task_id = (select id from did_task where boxed_task_id = ${boxId}))`)
    queryBuilder.push(`select * from purpose where id in (select purpose_id from gonna_purpose_task where gonna_task_id = (select id from gonna_task where boxed_task_id = ${boxId}))`)
    queryBuilder.push('commit')
    fs.writeFile('./src/database/wrt_table.sql', queryBuilder.join("\n"), 'utf-8', (err, data) => {
    })
    const response = await request.query(queryBuilder.join("\n"))
    queryBuilder.push()
    return response
}