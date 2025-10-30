import pandas as pd
import matplotlib.pyplot as plt
import japanize_matplotlib # 日本語表示用（環境によっては不要/別の方法が必要）

def create_top_videos_chart(file_path="data.csv", top_n=15):
    """
    CSVファイルを読み込み、視聴回数に基づいた動画ランキングTop Nを棒グラフで表示する。

    :param file_path: 処理するCSVファイルのパス
    :param top_n: ランキングの表示件数
    """
    try:
        # 1. CSVファイルの読み込み
        # 'watched_at'カラムを日付型としてパースする必要がないため、そのまま読み込む
        df = pd.read_csv(file_path)

        # 2. データの集計 (動画タイトルごとの視聴回数をカウント)
        # 'title'カラムでグループ化し、各グループのサイズ（行数＝視聴回数）を計算
        watch_counts = df['title'].value_counts()

        # 3. Top Nの動画を抽出
        top_videos = watch_counts.head(top_n)

        # 4. グラフの作成
        plt.figure(figsize=(12, 8)) # グラフのサイズを設定 (横長にする)

        # 棒グラフを作成。
        # y軸（タイトル）が長くなるため、横向きの棒グラフ (barh) を使用するのが一般的。
        # 視聴回数が多い順に上から表示するため、インデックスを逆順にソートしてプロット
        top_videos_sorted = top_videos.sort_values(ascending=True)

        plt.barh(top_videos_sorted.index, top_videos_sorted.values, color='skyblue')

        # 5. グラフの装飾
        plt.title(f'📺 視聴動画ランキング Top {top_n}', fontsize=16)
        plt.xlabel('視聴回数', fontsize=12)
        plt.ylabel('動画タイトル', fontsize=12)

        # 各棒の横に視聴回数をテキストで追加
        for index, value in enumerate(top_videos_sorted.values):
            plt.text(value, index, f' {value}', va='center')

        plt.grid(axis='x', linestyle='--', alpha=0.6) # X軸にグリッド線を追加
        plt.tight_layout() # タイトルやラベルが重ならないように調整
        plt.show()

    except FileNotFoundError:
        print(f"エラー: ファイルが見つかりません。パスを確認してください: {file_path}")
    except KeyError as e:
        print(f"エラー: 必須カラムが見つかりません。CSVファイルに {e} カラムがあるか確認してください。")
    except Exception as e:
        print(f"予期せぬエラーが発生しました: {e}")

# 実行
if __name__ == "__main__":
    # 実行前に、このスクリプトと同じディレクトリに "data.csv" というファイル名で
    # データを保存してください。
    create_top_videos_chart("data.csv", top_n=50)