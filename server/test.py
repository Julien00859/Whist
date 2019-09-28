#!/usr/bin/env python3

import itertools
import operator
import unittest
import deck
import whist

class TestCard(unittest.TestCase):
    def testStr(self):
        card = deck.Card(deck.Name.ACE, deck.Symbol.HEART)
        self.assertEqual(str(card), "A♥")


class TestDeck(unittest.TestCase):
    def setUp(self):
        self.deck = deck.Deck.create_full()

    def testShuffle(self):
        self.deck.shuffle()
        self.assertEqual(len(self.deck), 4 * 13)

    def testDraw(self):
        p1 = self.deck.draw(13)
        self.assertEqual(set(self.deck), set(deck.Deck.create_full()) - set(p1))

    def testDrawEmpty(self):
        p1 = self.deck.draw(4 * 13)
        with self.assertRaises(Exception):
            self.deck.draw(1)

    def testDeal(self):
        p1, p2, p3, p4 = self.deck.deal(4)
        self.assertEqual(set(p1) | set(p2) | set(p3) | set(p4), set(deck.Deck.create_full()))
        self.assertEqual(len(self.deck), 0)
        for p in (p1, p2, p3, p4):
            self.assertEqual(len(p), 13)

    def testSort(self):
        self.deck.shuffle()
        cards = self.deck.draw(13)
        cards.sort()

        groups = list(itertools.groupby(cards, key=operator.attrgetter("symbol")))
        self.assertLessEqual(len(groups), 4)
        symbols_seen = set()
        for symbol, s_cards in groups:
            s_cards = list(s_cards)
            self.assertNotIn(symbol, symbols_seen)
            symbols_seen.add(symbol)
            self.assertEqual(s_cards, sorted(s_cards, key=operator.attrgetter("value")))


class TestScore(unittest.TestCase):
    def testSolo6(self):
        truths = [(-30, 20), (-27, 18), (-24, 16), (-21, 14), (-18, 12),
                  (-15, 10), (12, 0), (15, 0), (18, 0), (18, 0), (18, 0),
                  (18, 0), (18, 0), (18, 0)]
        for fold, truth in enumerate(truths):
            with self.subTest(fold=fold):
                self.assertEqual(whist.compute_score('Solo 6', fold), truth)

    def testSolo7(self):
        truths = [(-36, 24), (-33, 22), (-30, 20), (-27, 18), (-24, 16),
                  (-21, 14), (-18, 12), (15, 0), (18, 0), (18, 0), (18, 0),
                  (18, 0), (18, 0), (18, 0)]
        for fold, truth in enumerate(truths):
            with self.subTest(fold=fold):
                self.assertEqual(whist.compute_score('Solo 7', fold), truth)

    def testSolo8(self):
        truths = [(-42, 30), (-39, 28), (-36, 26), (-33, 24), (-30, 22),
                  (-27, 20), (-24, 18), (-21, 16), (18, 0), (18, 0), (18, 0),
                  (18, 0), (18, 0), (18, 0)]
        for fold, truth in enumerate(truths):
            with self.subTest(fold=fold):
                self.assertEqual(whist.compute_score('Solo 8', fold), truth)
        


if __name__ == '__main__':
    unittest.main()
