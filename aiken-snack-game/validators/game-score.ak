use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction}

pub type Datum {
  owner: VerificationKeyHash,
  name: ByteArray,
  score: Int,
  numberOfPlayers: Int,
}


pub type Action {
  UpdateScore(Int)
}

validator game_score {
  spend(datum: Option<Datum>, _redeemer: Action, _own_ref: OutputReference, ctx: Transaction) {
    expect Some(state) = datum
    True
  }
}