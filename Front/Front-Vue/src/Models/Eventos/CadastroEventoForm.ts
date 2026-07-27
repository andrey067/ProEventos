export interface CadastrarEventoFrom {
    tema: String,
    local: String,
    dataEvento: String,
    passawords: {
        password: String,
        confirPassword: String
    },
    qtdPessoas: Number,
    telefone: Number,
    email: String,
    urlImagem: any
}