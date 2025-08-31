import csv
import random
import string
from itertools import cycle, islice

def random_id():
    return ''.join(random.choices(string.digits, k=6))

def random_string(length=8):
    return ''.join(random.choices(string.ascii_letters, k=length))

def random_complex_string(length=12):
    chars = string.ascii_letters + string.digits + "!@#$%^&*()"
    return ''.join(random.choices(chars, k=length))

def write_csv(filename, rows, headers):
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

def generate_record(col_count):
    record = [random_id(), random_string()]
    for _ in range(col_count):
        record.append(random_complex_string())
    return record

def generate_records(count, col_count):
    return [generate_record(col_count) for _ in range(count)]

def generate_files(n, abc_records, def1_records, def1_match, def2_records, def2_match, columns):
    col_count = len(columns)
    headers = ['id', 'name'] + columns

    abc_rows = generate_records(abc_records, col_count)

    def1_match_rows = list(islice(cycle(abc_rows), def1_match))
    def1_new_rows = generate_records(def1_records - def1_match, col_count)
    def1_rows = def1_match_rows + def1_new_rows
    random.shuffle(def1_rows)

    def1_keys = set(tuple(row) for row in def1_rows)

    abc_not_in_def1 = [row for row in abc_rows if tuple(row) not in def1_keys]

    def2_match_rows = list(islice(cycle(abc_not_in_def1), def2_match))
    def2_new_rows = generate_records(def2_records - def2_match, col_count)
    def2_rows = def2_match_rows + def2_new_rows
    random.shuffle(def2_rows)

    write_csv(f'./sample_csv/abc_{n}.csv', abc_rows, headers)
    write_csv(f'./sample_csv/def_{n}_1.csv', def1_rows, headers)
    write_csv(f'./sample_csv/def_{n}_2.csv', def2_rows, headers)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Generate sample CSV files with controlled overlap.')
    parser.add_argument('--n', type=int, default=10, help='n in file name (abc_n.csv, def_n_k.csv)')
    parser.add_argument('--abc_records', type=int, default=50)
    parser.add_argument('--def1_records', type=int, default=28)
    parser.add_argument('--def1_match', type=int, default=27)
    parser.add_argument('--def2_records', type=int, default=25)
    parser.add_argument('--def2_match', type=int, default=22)
    parser.add_argument('--cols', nargs='+', default=['name', 'col1'], help='List of column names after "id"')

    args = parser.parse_args()

    generate_files(
        args.n,
        args.abc_records,
        args.def1_records,
        args.def1_match,
        args.def2_records,
        args.def2_match,
        args.cols
    )
