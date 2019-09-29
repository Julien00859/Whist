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

    def testEmballage8(self):
        truths = [(-31, 31), (-28, 28), (-25, 25), (-22, 22), (-19, 19),
                  (-16, 16), (-13, 13), (-10, 10), (7, 0), (10, 0), (13, 0),
                  (16, 0), (19, 0), (30, 0)]
        for fold, truth in enumerate(truths):
            with self.subTest(fold=fold):
                self.assertEqual(whist.compute_score('Emballage 8', fold), truth)

    def testEmballage9(self):
        truths = [(-37, 37), (-34, 34), (-31, 31), (-28, 28), (-25, 25),
                  (-22, 22), (-19, 19), (-16, 16), (-13, 13), (10, 0), (13, 0),
                  (16, 0), (19, 0), (30, 0)]
        for fold, truth in enumerate(truths):
            with self.subTest(fold=fold):
                self.assertEqual(whist.compute_score('Emballage 9', fold), truth)

    def testEmballage10(self):
        truths = [(-43, 43), (-40, 40), (-37, 37), (-34, 34), (-31, 31),
                  (-28, 28), (-25, 25), (-22, 22), (-19, 19), (-16, 16),
                  (13, 0), (16, 0), (19, 0), (30, 0)]
        for fold, truth in enumerate(truths):
            with self.subTest(fold=fold):
                self.assertEqual(whist.compute_score('Emballage 10', fold), truth)

    def testEmballage11(self):
        truths = [(-49, 49), (-46, 46), (-43, 43), (-40, 40), (-37, 37),
                  (-34, 34), (-31, 31), (-28, 28), (-25, 25), (-22, 22),
                  (-19, 19), (16, 0), (19, 0), (30, 0)]
        for fold, truth in enumerate(truths):
            with self.subTest(fold=fold):
                self.assertEqual(whist.compute_score('Emballage 11', fold), truth)

    def testEmballage12(self):
        truths = [(-55, 55), (-52, 52), (-49, 49), (-46, 46), (-43, 43),
                  (-40, 40), (-37, 37), (-34, 34), (-31, 31), (-28, 28),
                  (-25, 25), (-22, 22), (19, 0), (30, 0)]
        for fold, truth in enumerate(truths):
            with self.subTest(fold=fold):
                self.assertEqual(whist.compute_score('Emballage 12', fold), truth)

    def testEmballage13(self):
        truths = [(-61, 61), (-58, 58), (-55, 55), (-52, 52), (-49, 49),
                  (-46, 46), (-43, 43), (-40, 40), (-37, 37), (-34, 34),
                  (-31, 31), (-28, 28), (-25, 25), (30, 0)]
        for fold, truth in enumerate(truths):
            with self.subTest(fold=fold):
                self.assertEqual(whist.compute_score('Emballage 13', fold), truth)


if __name__ == '__main__':
    unittest.main()
