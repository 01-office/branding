import { Branding } from "@01.works/branding/react";

function App() {
  return (
    <main>
      <h1>@01.works/branding playground</h1>

      <h2>개발자 도구 여는 방법</h2>
      <ul>
        <li>
          macOS: <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>I</kbd>
        </li>
        <li>
          Windows / Linux: <kbd>F12</kbd> 또는 <kbd>Ctrl</kbd> +{" "}
          <kbd>Shift</kbd> + <kbd>I</kbd>
        </li>
        <li>또는 페이지에서 우클릭 → 검사(Inspect)</li>
      </ul>

      <p>
        Console 탭을 연 뒤 페이지를 새로고침하세요.{" "}
        <strong>Website by</strong> 아래에 링크가 바로 보입니다.
      </p>

      <Branding />
    </main>
  );
}

export default App;
