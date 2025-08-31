# CSV比較ツール (script.js)

このJavaScriptコードは、ブラウザ上でCSVファイルをドラッグ＆ドロップし、2つまたは3つのCSVファイルを比較するためのツールです。

---

## 機能概要

- ドラッグ＆ドロップで最大3つのCSVファイルをアップロード可能
- ファイル名の形式に基づいて自動的にファイルを分類：
  - `abc_n.csv` ファイル（基準ファイル、1つのみ）
  - `def_n_k.csv` ファイル（比較対象ファイル、1つまたは2つ）
- `abc_n.csv` の `n` と `def_n_k.csv` の `n` が一致しない場合はエラー表示
- `def_n_k.csv` が2つある場合は縦に結合して比較
- CSVの中身を `id`, `name`, `col1` の3カラムでパースし、差分を検出
- 差分は画面上に表示され、差分CSVファイルとして自動ダウンロードもされる

---

## 使い方

1. ページを開き、表示されたドラッグ＆ドロップ領域にCSVファイルを最大3つドロップする

2. ドロップしたファイルのリストが表示される

3. 2つ以上の有効なファイルがアップロードされると「比較実行」ボタンが表示される

4. 「比較実行」ボタンをクリックすると比較が実行され、差分結果が画面に表示される

5. 差分結果のCSVファイルが自動的にダウンロードされる
---

## ファイル名ルール

- 基準ファイル：`abc_n.csv` （例：`abc_10.csv`）
- 比較対象ファイル：`def_n_k.csv` （例：`def_10_1.csv`、`def_10_2.csv`）

`n` は数字部分で、基準ファイルと比較対象ファイルは同じ `n` を持つ必要がある

---

## 仕様詳細

- 比較は `id` + `name` + `col1` の組み合わせで行う
- 差分は以下の2種類で出力される：
  - `abc_n.csv` にのみ存在する行（追加された行）
  - `abc_n.csv` に存在せず `def_n_k.csv` にのみ存在する行（削除された行）
- 差分ファイルは `diff_n.csv` として自動ダウンロードされる

---

## 注意事項

- ファイルはCSV形式で、カラムは3つ（`id`, `name`, `col1`）を想定している
- 2つ以上3つ以下のファイルが必要
- ファイル名の形式がルールに沿わない場合はエラーが表示される
- ページ全体のドラッグ＆ドロップは制御されており、意図しないファイル読み込みを防止している

---

## カスタマイズ

- ファイル名の正規表現や比較カラムはスクリプト内で調整可能
- 差分表示のスタイルはCSSで自由に変更可能

---


# CSVファイル生成スクリプト (create_records.py)

このスクリプトは、3つのCSVファイル（`abc_n.csv`、`def_n_1.csv`、`def_n_2.csv`）を生成する

- `abc_n.csv`：基準となるCSVファイル（レコード数は指定可能）
- `def_n_1.csv`：`abc_n.csv`の一部レコードを含むCSV（ランダムに生成されたレコードも含む）
- `def_n_2.csv`：`abc_n.csv`の`def_n_1.csv`に含まれない一部レコードとランダムレコードを含むCSV

---

## 特徴

- `def_n_1.csv`と`abc_n.csv`は指定した数の一致レコードを持つ
- `def_n_2.csv`は`def_n_1.csv`に含まれない`abc_n.csv`のレコードの一部を含む
- `def_n_1.csv`と`def_n_2.csv`のレコード順はランダムにシャッフルされている
- レコードは3カラム（`id`, `name`, `col1`）のランダム文字列で構成

---

## 必要環境

- Python 3.x

---

## 使い方

```bash
python generate_csv.py n [--abc_records ABC_RECORDS] [--def1_records DEF1_RECORDS] [--def1_match DEF1_MATCH] [--def2_records DEF2_RECORDS] [--def2_match DEF2_MATCH]
--n
    出力ファイル名に使う番号（例: 10 → abc_10.csv、def_10_1.csvなど）
--abc_records
    abc_n.csvのレコード数（デフォルト: 50）
--def1_records
    def_n_1.csvのレコード数（デフォルト: 28）
--def1_match
    def_n_1.csvがabc_n.csvと一致するレコード数（デフォルト: 27）
--def2_records
    def_n_2.csvのレコード数（デフォルト: 25）
--def2_match
    def_n_2.csvがabc_n.csvかつdef_n_1.csvに含まれない一致レコード数（デフォルト: 22）
```

## ファイル生成の例
```
 $ python generate_csv.py 10 --abc_records 50 --def1_records 28 --def1_match 27 --def2_records 25 --def2_match 22 --col col1 col2 col3 col4
```
- abc_10.csv（50レコード）
- def_10_1.csv（28レコード、そのうち27レコードがabc_10.csvと一致）
- def_10_2.csv（25レコード、そのうち22レコードがabc_10.csvかつdef_10_1.csvに含まれない）
- id, name, col1, col2, col3, col4 をカラムとして生成する。
---
