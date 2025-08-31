import csv
import random
import string

def random_id():
    return ''.join(random.choices(string.digits, k=6))

def random_string(length=8):
    return ''.join(random.choices(string.ascii_letters, k=length))

def random_complex_string(length=12):
    chars = string.ascii_letters + string.digits + "!@#$%^&*()"
    return ''.join(random.choices(chars, k=length))

def write_csv(filename, rows):
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'name', 'col1'])
        writer.writerows(rows)

def generate_records(count):
    return [[random_id(), random_string(), random_complex_string()] for _ in range(count)]

def generate_files(n, abc_records=50, def1_records=28, def1_match=27, def2_records=25, def2_match=22):
    
    abc_rows = generate_records(abc_records)
    def1_rows = abc_rows[:def1_match] + generate_records(def1_records - def1_match)
    random.shuffle(def1_rows)  # 追加：順番をランダムに入れ替え

    def1_keys = set(tuple(row) for row in def1_rows)

    # abcのうちdef1にないものを抽出
    abc_not_in_def1 = [row for row in abc_rows if tuple(row) not in def1_keys]

    # def2に入れるabcとdef1にないレコードはdef2_match件選ぶ
    if len(abc_not_in_def1) < def2_match:
        raise ValueError(f"abcにありdef1にないレコードが不足しています。必要: {def2_match}, 実際: {len(abc_not_in_def1)}")

    def2_abc_part = abc_not_in_def1[:def2_match]

    # def2の残りはランダム生成
    def2_random_part = generate_records(def2_records - def2_match)

    def2_rows = def2_abc_part + def2_random_part
    random.shuffle(def2_rows)  # 追加：順番をランダムに入れ替え

    # ファイル出力
    write_csv(f'./sample_csv/abc_{n}.csv', abc_rows)
    write_csv(f'./sample_csv/def_{n}_1.csv', def1_rows)
    write_csv(f'./sample_csv/def_{n}_2.csv', def2_rows)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Generate sample CSV files with controlled overlap.')
    parser.add_argument('--n', type=int, default=10, help='n in file name (abc_n.csv, def_n_k.csv)')
    parser.add_argument('--abc_records', type=int, default=50, help='Number of records in abc file')
    parser.add_argument('--def1_records', type=int, default=28, help='Number of records in def_1 file')
    parser.add_argument('--def1_match', type=int, default=27, help='Number of matching records between abc and def_1')
    parser.add_argument('--def2_records', type=int, default=25, help='Number of records in def_2 file')
    parser.add_argument('--def2_match', type=int, default=22, help='Number of matching records between abc and def_2 excluding def_1')
    args = parser.parse_args()

    generate_files(args.n, args.abc_records, args.def1_records, args.def1_match, args.def2_records, args.def2_match)
