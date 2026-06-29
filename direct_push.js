import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runGitCommand(args) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Git 실행: git ${args.join(' ')}`);
    const proc = spawn('git', args, { 
      cwd: __dirname,
      stdio: 'inherit',
      shell: true 
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Git 명령 실패 (Exit Code: ${code})`));
      }
    });
  });
}

async function startGitFlow() {
  try {
    console.log("🔗 원격 저장소 URL 설정 중...");
    try {
      await runGitCommand(['init']);
    } catch (e) {}

    try {
      await runGitCommand(['remote', 'add', 'origin', 'https://github.com/eery1677-lab/template.git']);
    } catch (e) {
      await runGitCommand(['remote', 'set-url', 'origin', 'https://github.com/eery1677-lab/template.git']);
    }

    await runGitCommand(['add', '.']);
    await runGitCommand(['commit', '-m', '"Fix: 요금제 카드 네온 및 테두리 색상 개별화, 무료 모달 페이팔 중복 겹침 오류 완전 해결"']);
    console.log("⛪ 원격 깃허브 저장소로 코드를 전송합니다...");
    await runGitCommand(['push', '-u', 'origin', 'main', '--force']);
    console.log("✨ 깃허브 저장 및 업로드가 완전히 성공했습니다!");
    process.exit(0);
  } catch (err) {
    console.error("❌ 깃 흐름 중 오류 발생:", err.message);
    process.exit(1);
  }
}

startGitFlow();
