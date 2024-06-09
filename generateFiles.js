import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { CsharpToTs, getConfiguration } from 'csharp-to-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const main = async () => {
  try {
    const prefix = await askPrefix();
    const path = await askPath();

    const file = await fs.promises.readFile(path, 'utf-8');

    console.log('meu aq:', file);

    await createFiles(prefix, file);
  } catch (error) {
    console.log(error);
  } finally {
    rl.close();
  }
};

// Função para criar os arquivos baseados no prefixo
const createFiles = async (prefix, fileString) => {
  // Definir os sufixos desejados
  const suffixes = ['Criar', 'Criado', 'Excluir', 'Excluido', 'Alterar', 'Alterado', 'Recuperar', 'Recuperado'];
  const fields = await fieldsItems(fileString);

  const pastaTSDto = path.join(__dirname, 'ts');
  const pastaSharpDto = path.join(__dirname, 'csharp');

  createDirectoryIfNotExists(pastaTSDto);
  createDirectoryIfNotExists(pastaSharpDto);

  clearFiles(pastaTSDto);
  clearFiles(pastaSharpDto);

  // Para cada sufixo, criar o nome do arquivo e o conteúdo
  suffixes.forEach((suffix) => {
    const fileNameCsharp = `${prefix}${suffix}Dto.cs`;
    const fileNameTypescript = `${prefix}${suffix}Dto.ts`;

    // Caminho completo do arquivo
    const filePathCsharp = path.join(pastaSharpDto, fileNameCsharp);
    const filePathTS = path.join(pastaTSDto, fileNameCsharp);

    // Conteúdo do arquivo
    const content = `public class ${prefix}${suffix}Dto 
    ${fields}
    `;

    //Cria o arquivo c#
    fs.writeFile(filePathCsharp, content, (err) => {
      if (err) {
        console.error(`Erro ao criar o arquivo ${fileNameCsharp}:`, err);
      } else {
        console.log(`Arquivo ${fileNameCsharp} criado com sucesso.`);
      }
    });

    //Cria de c# para typescript
    const outputTypescript = CsharpToTs(content, getConfiguration());
    fs.writeFile(filePathTS, outputTypescript, (err) => {
      if (err) {
        console.error(`Erro ao criar o arquivo ${fileNameTypescript}:`, err);
      } else {
        console.log(`Arquivo ${fileNameTypescript} criado com sucesso.`);
      }
    });
  });
};

const askPrefix = () => {
  return new Promise((resolve, reject) => {
    rl.question('Digite o prefixo para os arquivos.cs: ', (prefix) => {
      if (prefix) {
        resolve(prefix);
      } else {
        reject(new Error('Você deve fornecer um prefixo.'));
      }
    });
  });
};

const askPath = () => {
  return new Promise((resolve, reject) => {
    rl.question('Coloque o caminho da entity para a copia: ', (path) => {
      if (path) {
        const pathFormatted = path.replace(/\\/g, '\\\\');

        resolve(pathFormatted);
      } else {
        reject(new Error('Você deve fornecer o caminho da entity!'));
      }
    });
  });
};

const fieldsItems = async (pathFile) => {
  const pattern = '{([^{}]*|({([^{}]*|({([^{}]*|({([^{}]*|({([^{}]*)*}))*}))*}))*}))*}';

  const fields = pathFile.match(pattern);

  return fields[0];
};

const clearFiles = async (folderPath) => {
  const files = await fs.promises.readdir(folderPath);

  for (let file of files) {
    await fs.promises.unlink(folderPath + '/' + file);
  }

  console.log(`${folderPath}: Arquivos antigos deletados`);
};

const createDirectoryIfNotExists = (folderPath) => {
  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      console.error('Erro ao criar o diretório:', err);
    } else {
      console.log(`Diretório '${folderPath}' criado com sucesso ou já existe.`);
    }
  });
};

main();
