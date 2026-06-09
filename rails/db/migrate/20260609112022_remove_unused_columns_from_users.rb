class RemoveUnusedColumnsFromUsers < ActiveRecord::Migration[7.2]
  # devise_token_auth ジェネレータ起源で未使用のまま残った 2 列を削除する。
  # - users.nickname : どこからも参照されない予約席
  # - users.image    : has_one_attached :image に accessor を乗っ取られた孤立 string 列
  # PR-1 で ignored_columns を先行投入済みのため、本マイグレーションの DROP は安全。
  # down では元の定義（nullable な string・default なし）で復元する（データは復元不可）。
  def up
    remove_column :users, :nickname
    remove_column :users, :image
  end

  def down
    add_column :users, :nickname, :string
    add_column :users, :image, :string
  end
end
