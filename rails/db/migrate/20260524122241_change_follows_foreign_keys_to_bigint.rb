class ChangeFollowsForeignKeysToBigint < ActiveRecord::Migration[7.2]
  # follows.follower_id / following_id は users.id(bigint) を参照するが
  # integer で作られており型不一致のため外部キーを張れていなかった。
  # bigint に揃え、users への外部キー制約を追加して参照整合性を担保する。
  def up
    change_column :follows, :follower_id, :bigint, null: false
    change_column :follows, :following_id, :bigint, null: false

    add_foreign_key :follows, :users, column: :follower_id
    add_foreign_key :follows, :users, column: :following_id
  end

  def down
    remove_foreign_key :follows, column: :follower_id
    remove_foreign_key :follows, column: :following_id

    change_column :follows, :follower_id, :integer, null: false
    change_column :follows, :following_id, :integer, null: false
  end
end
