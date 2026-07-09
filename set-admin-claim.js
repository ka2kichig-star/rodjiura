/**
 * set-admin-claim.js  —  ろじうらサイト 管理者アカウント作成 & admin クレーム付与（ワンショット）
 * =============================================================================
 * ろじうらサイトの管理画面は Firebase Auth（email/password）でログインし、
 * カスタムクレーム admin:true を持つアカウントだけが管理操作できる。
 * カスタムクレームは Admin SDK（＝このスクリプト）でしか付与できない。ローカルで1回だけ実行する。
 *
 * 【事前準備】
 *  1. Firebaseコンソール → Authentication → Sign-in method で「メール/パスワード」を有効化。
 *  2. サービスアカウント鍵を取得:
 *       コンソール → プロジェクト設定 → サービスアカウント → 「新しい秘密鍵の生成」
 *     ダウンロードした JSON をこのフォルダに serviceAccountKey.json として置く。
 *     ★この鍵は絶対に公開しない。.gitignore に必ず追加すること（下記も参照）。
 *  3. 依存インストール:  npm install firebase-admin
 *
 * 【実行】
 *     ADMIN_EMAIL="owner@example.com" ADMIN_PASSWORD="十分に長いパスワード" node set-admin-claim.js
 *   （PowerShell:  $env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; node set-admin-claim.js ）
 *
 *   既にアカウントがあれば、そのメールにクレームだけ付与する（パスワードは変更しない）。
 *   無ければ新規作成してクレームを付与する。
 *
 * 【実行後】
 *   店主はそのメール/パスワードで管理画面にログインできる。ハードコードPW(rojiura2025)は廃止済み。
 * =============================================================================
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('❌ ADMIN_EMAIL と ADMIN_PASSWORD を環境変数で指定してください。');
  process.exit(1);
}
if (password.length < 10) {
  console.error('❌ パスワードは10文字以上にしてください。');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

(async () => {
  try {
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`ℹ 既存アカウントを使用: ${email} (uid=${user.uid})`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        user = await admin.auth().createUser({ email, password, emailVerified: true });
        console.log(`✅ アカウントを新規作成: ${email} (uid=${user.uid})`);
      } else {
        throw e;
      }
    }
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ admin:true クレームを付与しました (uid=${user.uid})`);
    console.log('   → 店主はこのメール/パスワードで管理画面にログインできます。');
    console.log('   → 既にログイン済みのセッションは、一度サインアウトすると新クレームが反映されます。');
    process.exit(0);
  } catch (err) {
    console.error('❌ 失敗:', err.message);
    process.exit(1);
  }
})();
