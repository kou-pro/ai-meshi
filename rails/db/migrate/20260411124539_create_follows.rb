class CreateFollows < ActiveRecord::Migration[7.2]
  def change
    create_table :follows do |t|
      t.integer :follower_id, null: false
      t.integer :following_id, null: false

      t.timestamps
    end

    # 複合ユニークインデックス
    add_index :follows, [:follower_id, :following_id], unique: true
    # 検索用インデックス
    add_index :follows, :following_id
  end
end