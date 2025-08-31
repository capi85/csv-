document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const fileList = document.getElementById('fileList');
  const compareBtn = document.getElementById('compareBtn');
  const result = document.getElementById('result');

  let selectedFiles = [];

  // ページ全体のドラッグ＆ドロップ禁止（勝手なファイル開き防止）
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => e.preventDefault());

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', e => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));

    if (droppedFiles.length === 0) {
      alert('CSVファイルをドロップしてください。');
      return;
    }

    if (selectedFiles.length + droppedFiles.length > 3) {
      alert('ファイルは最大3つまでしか選択できません。');
      return;
    }

    droppedFiles.forEach(f => {
      if (!selectedFiles.some(sf => sf.name === f.name)) {
        selectedFiles.push(f);
      }
    });

    updateFileList();

    compareBtn.style.display = (selectedFiles.length >= 2 && selectedFiles.length <= 3) ? 'inline-block' : 'none';

    result.innerHTML = '';
  });

  const resetBtn = document.getElementById('resetBtn');

  resetBtn.addEventListener('click', () => {
    selectedFiles = [];
    fileList.innerHTML = '';
    result.innerHTML = '';
    compareBtn.style.display = 'none';
  });

  compareBtn.addEventListener('click', () => {
    if (selectedFiles.length < 2 || selectedFiles.length > 3) {
      result.innerHTML = '<p style="color:red;">ファイルは2つか3つまで選択してください。</p>';
      return;
    }

    // 入力ファイル
    const fileABC = selectedFiles.find(f => f.name.startsWith('abc_'));
    const defFiles = selectedFiles.filter(f => f.name.startsWith('def_'));
    const defKValues = defFiles.map(f => {
      const match = f.name.match(/^def_\d+_(\d+)\.csv$/);
      return match ? parseInt(match[1], 10) : null;
    });

    const isK2 = defKValues.length === 2 && defKValues.includes(1) && defKValues.includes(2);
    const isK1 = defKValues.length === 1 && defKValues[0] === 1;

    if (!(isK1 || isK2)) {
      result.innerHTML = '<p style="color:red;">k=2 の場合、def_n_1.csv と def_n_2.csv の両方が必要です。</p>';
      return;
    }

    if (!fileABC) {
      result.innerHTML = '<p style="color:red;">abc_n.csv ファイルが必要です。</p>';
      return;
    }

    if (defFiles.length === 0) {
      result.innerHTML = '<p style="color:red;">def_n_k.csv ファイルが1つ以上必要です。</p>';
      return;
    }

    // abcのnを抽出
    const nABC = extractNFromFilename(fileABC.name, 'abc');
    if (!nABC) {
      result.innerHTML = '<p style="color:red;">abcファイルの名前が正しくありません。</p>';
      return;
    }

    // defファイルのnが全部一致しているかチェック
    const defNs = defFiles.map(f => extractNFromFilename(f.name, 'def'));
    if (defNs.includes(null) || !defNs.every(n => n === nABC)) {
      result.innerHTML = '<p style="color:red;">defファイルの n 部分が abcファイルと一致していません。</p>';
      return;
    }

    // ファイル読み込みをPromise化して全部読み込み
    Promise.all([
      readFileAsText(fileABC),
      ...defFiles.map(f => readFileAsText(f))
    ]).then(contents => {
      const contentABC = parseCSV(contents[0]);

      // defファイル複数あれば縦結合（ヘッダーは1つだけ使う）
      const defCSVs = contents.slice(1).map(c => parseCSV(c));
      const header = defCSVs[0][0]; // 先頭行をヘッダーとして採用

      // defCSVsすべてのデータ部分だけ取ってconcat
      const defData = defCSVs.flatMap(csv => csv.slice(1));

      // ヘッダーとデータを結合
      const contentDEF = [header, ...defData];

      showDiffAndDownload(contentABC, contentDEF, fileABC.name, defFiles.map(f => f.name).join(' + '), nABC);
    }).catch(err => {
      result.innerHTML = `<p style="color:red;">ファイル読み込み中にエラーが発生しました: ${err.message}</p>`;
    });
  });

  // PromiseでFileReaderをラップする関数
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsText(file);
    });
  }



  function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach(file => {
      const li = document.createElement('li');
      li.textContent = file.name;
      fileList.appendChild(li);
    });
  }

  function parseCSV(text) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  function extractNFromFilename(filename, prefix) {
    if (prefix === 'abc') {
      // 例: abc_123.csv
      const match = filename.match(/^abc_(\d+)\.csv$/);
      return match ? match[1] : null;
    } else if (prefix === 'def') {
      // 例: def_123_45.csv や def_123_abc.csv
      const match = filename.match(/^def_(\d+)_.*\.csv$/);
      return match ? match[1] : null;
    }
    return null;
  }

  function padArray(arr, targetLength, fillValue = { id: 'none', name: 'none', col1: 'none' }) {
    while (arr.length < targetLength) {
      arr.push(fillValue);
    }
  }

  function showDiffAndDownload(lines1, lines2, name1, name2, n) {
    // ヘッダーを除去してオブジェクトに変換
    const headers = lines1[0].split(',').map(h => h.trim());
    const data1 = lines1.slice(1).map(line => {
      const values = splitCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || '';
      });
      return obj;
    });
    const data2 = lines2.slice(1).map(line => {
      const values = splitCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || '';
      });
      return obj;
    });

    // idとnameでソート
    const sortFn = (a, b) => {
      if (a.id !== b.id) return a.id.localeCompare(b.id);
      return a.name.localeCompare(b.name);
    };
    data1.sort(sortFn);
    data2.sort(sortFn);

    // 比較キーは id + name + col1
    const keyOf = obj => `${obj.id}|||${obj.name}|||${obj.col1}`;

    const set1Keys = new Set(data1.map(keyOf));
    const set2Keys = new Set(data2.map(keyOf));

    const onlyInABC = data1.filter(obj => !set2Keys.has(keyOf(obj)));
    const notInABC = data2.filter(obj => !set1Keys.has(keyOf(obj)));

    // 配列長を揃える
    const maxRows = Math.max(onlyInABC.length, notInABC.length);
    padArray(onlyInABC, maxRows, { id: 'none', name: 'none', col1: 'none' });
    padArray(notInABC, maxRows, { id: 'none', name: 'none', col1: 'none' });

    // ヘッダー作成
    const diffHeaders = [
      'diff_id',
      'abc_only_id', 'abc_only_name', 'abc_only_col1',
      'no_abc_id', 'no_abc_name', 'no_abc_col1',
    ];
    const diffLines = [diffHeaders.join(',')];

    for (let i = 0; i < maxRows; i++) {
      const diffId = String(i + 1).padStart(11, '0');
      const abcRow = onlyInABC[i];
      const defRow = notInABC[i];

      const line = [
        diffId,
        abcRow.id || 'none',
        `"${(abcRow.name || 'none').replace(/"/g, '""')}"`,
        `"${(abcRow.col1 || 'none').replace(/"/g, '""')}"`,
        defRow.id || 'none',
        `"${(defRow.name || 'none').replace(/"/g, '""')}"`,
        `"${(defRow.col1 || 'none').replace(/"/g, '""')}"`,
      ].join(',');

      diffLines.push(line);
    }

    // 差分の画面表示
    let html = `<div class="diff-block"><h2>比較: ${name1} ↔ ${name2}</h2>`;
    if (onlyInABC.every(r => r.id === 'none') && notInABC.every(r => r.id === 'none')) {
      html += `<p>✅ 差分はありません。</p>`;
    } else {
      if (onlyInABC.some(r => r.id !== 'none')) {
        html += `<h3>➕ ${name1} にのみ存在する行 (${onlyInABC.filter(r => r.id !== 'none').length}件)</h3>`;
        onlyInABC.forEach(obj => {
          if (obj.id !== 'none') {
            html += `<pre class="added">+ id: ${obj.id}, name: ${obj.name}, col1: ${obj.col1}</pre>`;
          }
        });
      }
      if (notInABC.some(r => r.id !== 'none')) {
        html += `<h3>➖ ${name1} に存在しない行 (${notInABC.filter(r => r.id !== 'none').length}件)</h3>`;
        notInABC.forEach(obj => {
          if (obj.id !== 'none') {
            html += `<pre class="removed">- id: ${obj.id}, name: ${obj.name}, col1: ${obj.col1}</pre>`;
          }
        });
      }
    }
    html += `</div>`;
    result.innerHTML = html;

    // ダウンロード処理
    const blob = new Blob([diffLines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `diff_${n}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // カンマ区切りのCSVの行を正しく分割（簡易版）
  function splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(s => s.trim());
  }
});
